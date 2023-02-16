import { DocumentBinding, ElementBinding } from '../binding.js';
import {
  APP_ATTR,
  CLASS_PREFIX,
  CSR_MODE,
  HASH_ATTR,
  HASH_LENGTH,
  INPUT_ATTR,
  MODE_ATTR,
  ROUTE_ATTR,
  SPA_MODE,
  SRC_ATTR,
  STYLE_REF_ATTR,
  STYLE_TYPE_ATTR,
} from '../constants.js';
import SwayerEngine from '../core.js';
import SchemaHasher from '../hasher.js';
import {
  ElementRenderer,
  HeadRenderer,
  Renderer,
  RootRenderer,
  TextRenderer,
} from '../renderer.js';
import Reporter from '../reporter.js';
import { camelToKebabCase, hasOwn, normalizePath } from '../utils.js';

class ElementHasher {
  static #cache = {};
  static #hashCounters = {};

  static getElement(schema) {
    const hashes = ElementHasher.#hashCounters;
    const schemaHash = SchemaHasher.hashSchema(schema);
    const index = hasOwn(hashes, schemaHash)
      ? hashes[schemaHash] += 1
      : hashes[schemaHash] = 0;
    const hash = `${schemaHash}_${index}`;
    return ElementHasher.#cache[hash];
  }

  static cacheHashedElements(elements) {
    const cacheHash = (map, elem) => {
      map[elem.dataset[HASH_ATTR]] = elem;
      return map;
    };
    ElementHasher.#cache = elements.reduce(cacheHash, ElementHasher.#cache);
  }

  static flush() {
    ElementHasher.#cache = {};
    ElementHasher.#hashCounters = {};
  }
}

class DocumentRenderer extends RootRenderer {
  createBinding() {
    const webApi = this.engine.webApi;
    const schema = this.context.schema;
    return new DocumentBinding(webApi, schema);
  }
}

class HtmlRenderer extends ElementRenderer {
  render() {
    this.engine.webApi.document.documentElement.remove();
    super.render();
  }
}

class DocumentHydrationRenderer extends Renderer {
  styles;

  constructor(styles, engine, context) {
    super(engine, context);
    this.styles = styles;
    for (const [type, style] of styles) {
      this.#initStyle(type, style);
    }
  }

  createBinding() {
    const webApi = this.webApi;
    const schema = this.context.schema;
    return new DocumentBinding(webApi, schema);
  }

  render() {}

  replace() {}

  #initStyle(type, style) {
    const sheet = style.sheet;
    const ruleHandler = (rule) => sheet.insertRule(rule, sheet.cssRules.length);
    const classes = Array
      .from(sheet.cssRules)
      .filter((rule) => rule.selectorText)
      .map((rule) => {
        const selector = rule.selectorText;
        const start = selector.indexOf('.');
        const end = CLASS_PREFIX.length + HASH_LENGTH;
        return selector.slice(start + 1, start + end + 1);
      });
    this.context.createStyler(type, ruleHandler, classes);
  }
}

const createElementHydrationRenderer = (Base = Renderer) => class extends Base {
  createBinding() {
    const schema = this.context.schema;
    const webApi = this.webApi;
    const element = ElementHasher.getElement(schema);
    return new ElementBinding(webApi, schema, element);
  }

  render() {
    if (this.binding.isHydrated) return;
    super.render();
  }
};

class TextHydrationRenderer extends TextRenderer {
  render() {
    const { children, binding: parentBinding } = this.context.parent;
    const contexts = children.flat();
    const index = contexts.indexOf(this.context);
    const { childNodes } = parentBinding.getNativeNode();
    const node = childNodes[index];
    if (node) {
      const text = this.context.binding.getNativeNode();
      const textType = this.webApi.Node.TEXT_NODE;
      const isText = node.nodeType === textType;
      if (isText) node.replaceWith(text);
      else node.before(text);
      return;
    }
    super.render();
  }
}

class CSREngine extends SwayerEngine {
  renderContext(context) {
    const renderedContext = super.renderContext(context);
    const isBodyReached = renderedContext.schema.tag === 'body';
    if (isBodyReached) this.resetDefaultRenderers();
    return renderedContext;
  }
}

class BrowserPlatform {
  #webApi;
  #dom;
  #location;
  #engine;

  constructor(webApi) {
    this.#webApi = webApi;
    this.#dom = webApi.document;
    this.#location = webApi.location;
  }

  start() {
    const bootstrap = async () => {
      const appAttr = camelToKebabCase(APP_ATTR);
      const mountElement = this.#dom.querySelector(`[data-${appAttr}]`);
      if (!mountElement) throw Reporter.error('BadMount');
      const path = mountElement.dataset[SRC_ATTR];
      const input = mountElement.dataset[INPUT_ATTR];
      const schemaRef = { path };
      if (input) schemaRef.input = JSON.parse(input);
      const mode = mountElement.dataset[MODE_ATTR];
      if (mode === SPA_MODE) {
        this.#createSPAEngine();
        await this.#renderApp(schemaRef);
      } else {
        const route = mountElement.dataset[ROUTE_ATTR];
        const styles = this.#getStyles(mountElement);
        await this.#hydrate(mountElement);
        this.#createEngine(mode, route, styles);
        await this.#renderApp(schemaRef);
        this.#cleanHydration();
      }
    };
    const isLoading = this.#dom.readyState === 'loading';
    if (isLoading) this.#dom.addEventListener('DOMContentLoaded', bootstrap);
    else void bootstrap();
  }

  #createEngine(mode, route, styles) {
    const routingPath = this.#createRoutingPath();
    const normalRoute = normalizePath(route);
    if (routingPath !== normalRoute) throw Reporter.error('RouteMismatch');
    const origin = this.#location.origin;
    const baseURI = this.#dom.baseURI;
    const options = {
      mode,
      basePath: baseURI.replace(origin, ''),
      entryModulePath: this.#dom.baseURI,
      routingPath,
    };
    const Engine = mode === CSR_MODE ? CSREngine : SwayerEngine;
    this.#engine = new Engine(this.#webApi, options);
    const RootRenderer = DocumentHydrationRenderer;
    this.#engine.setRendererTypes({
      root: RootRenderer.bind(RootRenderer, styles),
      text: TextHydrationRenderer,
      html: createElementHydrationRenderer(ElementRenderer),
      head: createElementHydrationRenderer(HeadRenderer),
      element: createElementHydrationRenderer(ElementRenderer),
    });
  }

  #createSPAEngine() {
    const origin = this.#location.origin;
    const baseURI = this.#dom.baseURI;
    const options = {
      mode: SPA_MODE,
      basePath: baseURI.replace(origin, ''),
      entryModulePath: this.#dom.baseURI,
      routingPath: this.#createRoutingPath(),
    };
    this.#engine = new SwayerEngine(this.#webApi, options);
    this.#engine.setRendererTypes({
      root: DocumentRenderer,
      html: HtmlRenderer,
    });
  }

  #createRoutingPath() {
    const { origin, href } = this.#location;
    const baseURI = this.#dom.baseURI;
    const normalHref = normalizePath(href.replace(origin, ''));
    const normalBase = normalizePath(baseURI.replace(origin, ''));
    return normalHref.replace(normalBase, '') || '/';
  }

  async #renderApp(schemaRef) {
    const generator = await this.#engine.run(schemaRef);
    await this.#engine.finalize(generator);
    this.#engine.resetDefaultRenderers();
  }

  #hydrate(mountElement) {
    const hashedElements = [mountElement];
    const hashAttr = camelToKebabCase(HASH_ATTR);
    const elements = mountElement.querySelectorAll(`[data-${hashAttr}]`);
    hashedElements.push(...elements);
    ElementHasher.cacheHashedElements(hashedElements);
  }

  #cleanHydration() {
    ElementHasher.flush();
  }

  #getStyles(element) {
    const styleId = element.dataset[HASH_ATTR];
    const styleRefAttr = camelToKebabCase(STYLE_REF_ATTR);
    const styles = [...this.#dom.querySelectorAll(`[data-${styleRefAttr}]`)];
    const checkId = (style) => style?.dataset[STYLE_REF_ATTR] === styleId;
    if (styles.every(checkId)) {
      return new Map(styles.map(
        (style) => [style.dataset[STYLE_TYPE_ATTR], style],
      ));
    }
    throw Reporter.error('BadStyles');
  }
}

new BrowserPlatform(window).start();
