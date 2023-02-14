import { JSDOM } from 'jsdom';
import fsp from 'node:fs/promises';
import { basename, join, posix } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'url';
import { FragmentBinding } from '../binding.js';
import {
  APP_ATTR,
  CSR_MODE,
  ENTRY_FILE_NAME,
  HASH_ATTR,
  INPUT_ATTR,
  MODE_ATTR,
  ROUTE_ATTR,
  SPA_MODE,
  SRC_ATTR,
  SSR_MODE,
  STYLE_REF_ATTR,
  STYLE_TYPE_ATTR,
} from '../constants.js';
import SwayerEngine from '../core.js';
import SchemaHasher from '../hasher.js';
import { ElementRenderer, HeadRenderer, RootRenderer } from '../renderer.js';
import Reporter from '../reporter.js';
import { camelToKebabCase, hasOwn, is } from '../utils.js';

// todo import as json when stable
const pkgUrl = join(import.meta.url, '..', '..', '..', 'package.json');
const pkgPath = fileURLToPath(pkgUrl);
const pkgJson = await fsp.readFile(pkgPath, 'utf-8');
const { version: swayerVersion } = JSON.parse(pkgJson);

const SWR_CDN_URL = `https://ga.jspm.io/npm:swayer@${swayerVersion}/index.js`;
const resolveEnginePath = (path = SWR_CDN_URL) => path;

class ContextHasher {
  #hashes = {};

  hashContext(context) {
    const { schema, binding } = context;
    const schemaHash = SchemaHasher.hashSchema(schema);
    return this.#setHash(binding, schemaHash);
  }

  #setHash(binding, schemaHash) {
    const hashes = this.#hashes;
    const index = hasOwn(hashes, schemaHash)
      ? hashes[schemaHash] += 1
      : hashes[schemaHash] = 0;
    const hash = `${schemaHash}_${index}`;
    binding.setData({ [HASH_ATTR]: hash });
    return hash;
  }
}

class ServerEngine extends SwayerEngine {
  hasher;
  options = {};

  async createContext(schema, parent = null) {
    this.hasher = new ContextHasher();
    const context = await super.createContext(schema, parent);
    this.hasher.hashContext(context);
    return context;
  }

  setOptions(options) {
    this.options = options;
  }
}

class SSREngine extends ServerEngine {
  renderContext(context) {
    if (!is.str(context.schema)) this.hasher.hashContext(context);
    return super.renderContext(context);
  }
}

class CSREngine extends ServerEngine {
  renderContext(context) {
    const isBodyParent = context.parent.schema.tag === 'body';
    if (isBodyParent) return false;
    this.hasher.hashContext(context);
    const renderedContext = super.renderContext(context);
    const isBodyReached = renderedContext.schema.tag === 'body';
    if (isBodyReached) return false;
    return renderedContext;
  }
}

const createServerRenderer = (Base) => class extends Base {
  renderQueue;

  constructor(engine, context) {
    super(engine, context);
    this.renderQueue = context.parent?.renderer.renderQueue || [];
  }

  renderChildren(inputArray) {
    const asyncTask = super.renderChildren(inputArray);
    this.renderQueue.push(asyncTask);
    return asyncTask;
  }

  renderSegment(input, segIndex) {
    const asyncTask = super.renderSegment(input, segIndex);
    this.renderQueue.push(asyncTask);
    return asyncTask;
  }

  async waitRenderQueue() {
    await Promise.all(this.renderQueue);
    this.renderQueue.length = 0;
  }
};

class FragmentRenderer extends createServerRenderer(RootRenderer) {
  createBinding() {
    const webApi = this.engine.webApi;
    const schema = this.context.schema;
    return new FragmentBinding(webApi, schema);
  }
}

class HtmlRenderer extends createServerRenderer(ElementRenderer) {
  render() {
    const stylesMap = this.context.parent.renderer.styles;
    for (const [type, style] of stylesMap) {
      style.dataset[STYLE_REF_ATTR] = this.binding.data[HASH_ATTR];
      style.dataset[STYLE_TYPE_ATTR] = type;
    }
    super.render();
  }

  setSystemAttrs(input) {
    const root = this.context.parent;
    const { mode, basePath } = this.engine.options;
    const srcPath = posix.join(basePath, root.originalSchema.path);
    const routingPath = posix.join(basePath, this.engine.routingPath);
    const data = {
      [APP_ATTR]: swayerVersion,
      [SRC_ATTR]: srcPath,
      [MODE_ATTR]: mode,
      [ROUTE_ATTR]: routingPath,
    };
    if (input) data[INPUT_ATTR] = JSON.stringify(input);
    this.binding.setData(data);
  }
}

class HeadServerRenderer extends createServerRenderer(HeadRenderer) {
  render() {
    super.render();
    const swayer = this.#createSwayerScript();
    const head = this.binding.getNativeNode();
    head.append(swayer);
  }

  replace(context) {
    super.replace(context);
    const head = context.binding.getNativeNode();
    const swayer = this.#createSwayerScript();
    head.append(swayer);
  }

  #createSwayerScript() {
    const script = this.engine.webApi.document.createElement('script');
    script.src = resolveEnginePath();
    script.type = 'module';
    return script;
  }
}

export default class ServerPlatform {
  #options;
  #webApi;
  #doctype;
  #engines = {
    [CSR_MODE]: CSREngine,
    [SSR_MODE]: SSREngine,
  };

  constructor(options = {}) {
    this.#options = options;
    this.#webApi = new JSDOM().window;
    this.#doctype = '<!doctype html>';
  }

  get #mode() {
    return this.#options.mode || CSR_MODE;
  }

  get #basePath() {
    const basePath = this.#options.basePath;
    return basePath ? posix.normalize(basePath) : '/';
  }

  async render(entryPath, input, routingPath = '/') {
    const rootSchemaRef = this.#createRootSchemaRef(entryPath, input);
    const engine = this.#createEngine(entryPath, routingPath);
    const generator = await engine.run(rootSchemaRef);
    const htmlContext = await this.#createHtml(generator);
    htmlContext.renderer.setSystemAttrs(input);
    await this.#createHead(generator);
    await engine.finalize(generator);
    await htmlContext.renderer.waitRenderQueue();
    return this.#createHtmlContent(htmlContext);
  }

  createSPA(title = 'Index', lang = 'en') {
    const appAttr = camelToKebabCase(APP_ATTR);
    const srcAttr = camelToKebabCase(SRC_ATTR);
    const modeAttr = camelToKebabCase(MODE_ATTR);
    const base = this.#basePath;
    const srcPath = posix.join(base, ENTRY_FILE_NAME);
    return `${this.#doctype}
<html lang="${lang}"
      data-${appAttr}="${swayerVersion}"
      data-${srcAttr}="${srcPath}"
      data-${modeAttr}="${SPA_MODE}"
>
  <head>
    <base href="${base}">
    <title>${title}</title>
    <script src="${resolveEnginePath()}" type="module"></script>
  </head>
  <body></body>
</html>`;
  }

  #createRootSchemaRef(entryPath, input) {
    const entryFileName = basename(entryPath);
    const isRootEntry = entryFileName === ENTRY_FILE_NAME;
    if (!isRootEntry) throw Reporter.error('UnsupportedEntry', ENTRY_FILE_NAME);
    return { path: entryFileName, ...(input ? { input } : {}) };
  }

  #createEngine(entryPath, routingPath) {
    const entryFilePath = pathToFileURL(entryPath).toString();
    const mode = this.#mode;
    const basePath = this.#basePath;
    const Engine = this.#engines[mode];
    const engine = new Engine(this.#webApi, entryFilePath, routingPath);
    engine.setOptions({ mode, basePath });
    engine.setRendererTypes({
      root: FragmentRenderer,
      html: HtmlRenderer,
      head: HeadServerRenderer,
      element: createServerRenderer(ElementRenderer),
    });
    return engine;
  }

  async #createHtml(generator) {
    const { value: htmlContext } = await generator.next();
    const htmlTag = htmlContext?.schema.tag;
    if (htmlTag !== 'html') throw Reporter.error('HtmlNotFound', htmlTag);
    return htmlContext;
  }

  async #createHead(generator) {
    const { value: headContext } = await generator.next();
    const headTag = headContext?.schema.tag;
    if (headTag !== 'head') throw Reporter.error('HeadNotFound', headTag);
    return headContext;
  }

  #createHtmlContent(htmlContext) {
    return this.#doctype + htmlContext.binding.html;
  }
}
