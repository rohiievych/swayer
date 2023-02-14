import { ElementBinding, TextBinding } from './binding.js';
import { COMPUTED_STYLE_TYPE, STATIC_STYLE_TYPE } from './constants.js';
import { equal, is } from './utils.js';

export class Renderer {
  engine;
  context;
  webApi;
  binding;

  constructor(engine, context) {
    this.engine = engine;
    this.context = context;
    this.webApi = engine.webApi;
    this.binding = this.createBinding();
  }

  /** @returns {import('./binding.js').NodeBinding} */
  createBinding() {
    throw new Error('Method not implemented');
  }

  render() {
    const { binding } = this.context;
    this.context.parent.binding.append(binding);
  }

  replace(context) {
    const { binding } = context;
    this.binding.replaceWith(binding);
    this.context.destroy();
  }

  after(context) {
    const { binding } = context;
    this.binding.after(binding);
  }

  append(context) {
    const { binding } = context;
    this.binding.append(binding);
  }

  prepend(context) {
    const { binding } = context;
    this.binding.prepend(binding);
  }

  remove() {
    this.binding.detach();
  }

  async renderChildren(schemas) {
    const parent = this.context;
    const segment = parent.children[0];
    for (let i = 0; i < schemas.length; ++i) {
      const schema = schemas[i];
      const context = segment[i];
      if (this.#compareSchemas(context, schema)) continue;
      const startContext = await this.engine.createContext(schema, parent);
      if (context) {
        segment.splice(segment.indexOf(context), 1, startContext);
        context.renderer.replace(startContext);
      } else {
        segment.push(startContext);
        parent.renderer.append(startContext);
      }
      const generator = this.engine.start(startContext);
      await this.engine.finalize(generator);
    }
    this.#alignSegment(schemas, segment);
  }

  async renderSegment(schema, segIndex, force) {
    const isSingle = !is.arr(schema);
    if (isSingle) return this.#renderSegment(schema, segIndex, 0, force);
    for (let i = 0; i < schema.length; ++i) {
      await this.#renderSegment(schema[i], segIndex, i, force);
    }
    const segment = this.context.children[segIndex];
    this.#alignSegment(schema, segment);
  }

  #alignSegment(schemas, segment) {
    const leftover = segment.slice(schemas.length);
    for (const context of leftover) context.destroy();
    segment.length = schemas.length;
  }

  clearSegment(index) {
    const segment = this.context.children[index];
    while (segment.length > 0) segment.pop().destroy();
  }

  async #renderSegment(schema, segIndex, ctxIndex = 0, force = false) {
    if (!schema) return this.clearSegment(segIndex);
    const parent = this.context;
    const segment = parent.children[segIndex];
    const context = segment[ctxIndex];
    if (!force && this.#compareSchemas(context, schema)) return;
    const startContext = await this.engine.createContext(schema, parent);
    if (context) {
      context.renderer.replace(startContext);
    } else {
      const sibling = parent.children.getPrevSiblingContext(segIndex);
      if (sibling) sibling.renderer.after(startContext);
      else parent.renderer.prepend(startContext);
    }
    segment[ctxIndex] = startContext;
    const generator = this.engine.start(startContext);
    await this.engine.finalize(generator);
  }

  #compareSchemas(context, inputSchema) {
    return context && equal(context.originalSchema, inputSchema);
  }
}

export class TextRenderer extends Renderer {
  createBinding() {
    const webApi = this.webApi;
    const schema = this.context.schema;
    return new TextBinding(webApi, schema);
  }
}

export class ElementRenderer extends Renderer {
  createBinding() {
    const webApi = this.webApi;
    const schema = this.context.schema;
    return new ElementBinding(webApi, schema);
  }

  get #staticStyler() {
    return this.context.stylers[STATIC_STYLE_TYPE];
  }

  render() {
    const { schema } = this.context;
    this.#staticStyler.setStyles(this.context, schema.styles);
    return super.render();
  }

  replace(context) {
    const { schema } = context;
    this.#staticStyler.setStyles(context, schema.styles);
    return super.replace(context);
  }

  after(context) {
    const { schema } = context;
    this.#staticStyler.setStyles(context, schema.styles);
    return super.after(context);
  }

  append(context) {
    const { schema } = context;
    this.#staticStyler.setStyles(context, schema.styles);
    return super.append(context);
  }

  prepend(context) {
    const { schema } = context;
    this.#staticStyler.setStyles(context, schema.styles);
    return super.prepend(context);
  }
}

export class RootRenderer extends Renderer {
  styles = this.#createStyles();

  constructor(engine, context) {
    super(engine, context);
    this.#initStyles();
  }

  render() {}

  replace() {}

  #initStyles() {
    for (const [type, style] of this.styles) {
      const ruleHandler = (rule) => (style.textContent += rule);
      this.context.createStyler(type, ruleHandler);
    }
  }

  #createStyles() {
    const create = () => this.engine.webApi.document.createElement('style');
    return new Map([
      [STATIC_STYLE_TYPE, create()],
      [COMPUTED_STYLE_TYPE, create()],
    ]);
  }
}

export class HeadRenderer extends ElementRenderer {
  #stylesMap = this.context.parent.parent.renderer.styles;

  render() {
    const head = this.binding.getNativeNode();
    this.#createBase(head);
    head.append(...this.#stylesMap.values());
    super.render();
    for (const [type, style] of this.#stylesMap) {
      this.#resetStyleHandler(type, style.sheet);
    }
  }

  replace(context) {
    const mapping = Array.from(this.#stylesMap).map(
      ([type, style]) => [type, style, style.sheet],
    );
    const newHead = context.binding.getNativeNode();
    newHead.append(...this.#stylesMap.values());
    super.replace(context);
    for (const [type, style, sheet] of mapping) {
      this.#copySheetRules(sheet, style.sheet);
      this.#resetStyleHandler(type, sheet);
    }
  }

  #resetStyleHandler(styleType, sheet) {
    if (!sheet) return;
    const ruleHandler = (rule) => sheet.insertRule(rule, sheet.cssRules.length);
    this.context.stylers[styleType].setRuleHandler(ruleHandler);
  }

  #copySheetRules(fromSheet, toSheet) {
    if (!fromSheet || !toSheet) return;
    const fromRules = fromSheet.cssRules;
    for (let i = 0; i < fromRules.length; ++i) {
      toSheet.insertRule(fromRules[i].cssText);
    }
  }

  #createBase(head) {
    const basePath = this.engine.options.basePath;
    if (basePath === '/') return;
    const base = this.engine.webApi.document.createElement('base');
    base.href = basePath;
    head.append(base);
  }
}
