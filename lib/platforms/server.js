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
import { camelToKebabCase, hasOwn, is, normalizePath } from '../utils.js';

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

  async createContext(schema, parent = null) {
    this.hasher = new ContextHasher();
    const context = await super.createContext(schema, parent);
    this.hasher.hashContext(context);
    return context;
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
    const { mode, routingPath } = this.engine.options;
    const srcPath = root.originalSchema.path;
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
    script.src = this.engine.options.enginePath;
    script.type = 'module';
    return script;
  }
}

export default class ServerPlatform {
  #webApi;
  #doctype;
  #engines = {
    [CSR_MODE]: CSREngine,
    [SSR_MODE]: SSREngine,
  };

  constructor() {
    this.#webApi = new JSDOM().window;
    this.#doctype = '<!doctype html>';
  }

  createSPA(options) {
    const { title = 'Index', lang = 'en' } = options;
    const appAttr = camelToKebabCase(APP_ATTR);
    const srcAttr = camelToKebabCase(SRC_ATTR);
    const modeAttr = camelToKebabCase(MODE_ATTR);
    const engineSrc = resolveEnginePath(options.enginePath);
    const basePath = posix.normalize(options.basePath || '/');
    return `${this.#doctype}
<html lang="${lang}"
      data-${appAttr}="${swayerVersion}"
      data-${srcAttr}="${ENTRY_FILE_NAME}"
      data-${modeAttr}="${SPA_MODE}"
>
  <head>
    <base href="${basePath}">
    <title>${title}</title>
    <script src="${engineSrc}" type="module"></script>
  </head>
  <body></body>
</html>`;
  }

  async render(options) {
    const {
      entryPath, basePath, routePath,
      enginePath, input, mode,
    } = options;
    const rootSchemaRef = this.#createRootSchemaRef(entryPath, input);
    const engineOptions = { entryPath, basePath, routePath, enginePath, mode };
    const engine = this.#createEngine(engineOptions);
    const generator = await engine.run(rootSchemaRef);
    const htmlContext = await this.#createHtml(generator);
    htmlContext.renderer.setSystemAttrs(input);
    await this.#createHead(generator);
    await engine.finalize(generator);
    await htmlContext.renderer.waitRenderQueue();
    return this.#createHtmlContent(htmlContext);
  }

  #createRootSchemaRef(entryPath, input) {
    const entryFileName = basename(entryPath);
    const isRootEntry = entryFileName === ENTRY_FILE_NAME;
    if (!isRootEntry) throw Reporter.error('UnsupportedEntry', ENTRY_FILE_NAME);
    return { path: entryFileName, ...(input ? { input } : {}) };
  }

  #createEngine(options) {
    const engineMode = options.mode || CSR_MODE;
    const routePath = posix.normalize(options.routePath || '/');
    const basePath = posix.normalize(options.basePath || '/');
    const enginePath = resolveEnginePath(options.enginePath);
    const engineOptions = {
      mode: engineMode,
      basePath,
      enginePath,
      entryModulePath: pathToFileURL(options.entryPath).toString(),
      routingPath: this.#createRoutingPath(routePath, basePath),
    };
    const Engine = this.#engines[engineMode];
    const engine = new Engine(this.#webApi, engineOptions);
    engine.setRendererTypes({
      root: FragmentRenderer,
      html: HtmlRenderer,
      head: HeadServerRenderer,
      element: createServerRenderer(ElementRenderer),
    });
    return engine;
  }

  #createRoutingPath(routePath, basePath) {
    const normalPath = normalizePath(routePath);
    const normalBase = normalizePath(basePath);
    return normalPath.replace(normalBase, '') || '/';
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
