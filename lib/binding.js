import { CLASS_PREFIX, SYSTEM_PREFIX } from './constants.js';
import { hasOwn, is } from './utils.js';

export class NodeBinding {
  #webApi;
  #schema;
  #node;
  isHydrated;

  constructor(webApi, schema, node) {
    this.#webApi = webApi;
    this.#schema = schema;
    this.#node = node;
  }

  get html() {
    return this.#node.outerHTML;
  }

  get data() {
    return this.#node.dataset;
  }

  getNativeNode() {
    return this.#node;
  }

  setData(data) {
    let dataset = this.#node.dataset;
    if (!dataset) dataset = {};
    Object.assign(dataset, data);
  }

  setText(text) {
    if (!hasOwn(this.#schema, 'text')) return;
    if (is.nullish(text)) text = '';
    else if (!is.str(text)) text = text.toString();
    this.#node.textContent = text;
  }

  getText() {
    return this.#node.textContent;
  }

  setProperties(props) {
    if (!is.obj(props)) return;
    for (const [prop, value] of Object.entries(props)) {
      this.#node[prop] = value;
    }
  }

  getProperties() {
    const props = this.#schema.props;
    if (!is.obj(props)) return;
    const keys = Object.keys(props);
    if (keys.length === 0) return;
    const propsReducer = (props, prop) => {
      props[prop] = this.#node[prop];
      return props;
    };
    return keys.reduce(propsReducer, {});
  }

  setProperty(prop, value = '') {
    this.#node[prop] = value;
  }

  getProperty(prop) {
    return this.#node[prop];
  }

  setInlineStyle(props) {
    if (!is.obj(props)) return;
    for (const [prop, value] of Object.entries(props)) {
      this.#node.style[prop] = value;
    }
  }

  getInlineStyle() {
    return this.#node.style;
  }

  setInlineStyleProperty(prop, value) {
    this.#node.style[prop] = value;
  }

  getInlineStyleProperty(prop) {
    return this.#node.style[prop];
  }

  setAttributes(attrs) {
    if (!is.obj(attrs)) return;
    const attrNames = this.#node.getAttributeNames();
    const sysDataAttr = `data-${SYSTEM_PREFIX}`;
    for (const name of attrNames) {
      const hasAttr = Object.prototype.hasOwnProperty.call(attrs, name);
      const isMandatoryAttr = name.startsWith(sysDataAttr) || name === 'class';
      const redundant = !hasAttr && !isMandatoryAttr;
      if (redundant) this.#node.removeAttribute(name);
    }
    const attrPairs = Object.entries(attrs);
    for (const pair of attrPairs) this.setAttribute(...pair);
  }

  setAttribute(attr, value) {
    if (is.fn(value)) return;
    if (attr === 'style') this.setInlineStyle(value);
    else if (attr === 'class') this.setClasses(value);
    else if (value === true) this.#node.setAttribute(attr, '');
    else if (value === false) this.#node.removeAttribute(attr);
    else if (value !== undefined) this.#node.setAttribute(attr, value);
  }

  getAttributes() {
    const names = this.#node.getAttributeNames();
    if (names.length === 0) return;
    const attributesReducer = (attrs, name) => {
      attrs[name] = this.#node.getAttribute(name);
      return attrs;
    };
    return names.reduce(attributesReducer, {});
  }

  getAttribute(attr) {
    return this.#node.getAttribute(attr);
  }

  addEventListener(eventName, listener) {
    this.#node.addEventListener(eventName, listener);
  }

  removeEventListener(eventName, listener) {
    this.#node.removeEventListener(eventName, listener);
  }

  emitEvent(name, data) {
    const init = { bubbles: true, detail: data };
    const CustomEventCtor = this.#webApi.CustomEvent;
    const event = new CustomEventCtor(name, init);
    return this.#node.dispatchEvent(event);
  }

  isCustomEvent(event) {
    const CustomEventCtor = this.#webApi.CustomEvent;
    return event instanceof CustomEventCtor;
  }

  click() {
    this.#node.click();
  }

  focus() {
    this.#node.focus();
  }

  blur() {
    this.#node.blur();
  }

  append(...nodeBindings) {
    if (nodeBindings.length === 0) return;
    const elements = nodeBindings.map((binding) => binding.getNativeNode());
    this.#node.append(...elements);
  }

  prepend(...nodeBindings) {
    if (nodeBindings.length === 0) return;
    const elements = nodeBindings.map((binding) => binding.getNativeNode());
    this.#node.prepend(...elements);
  }

  after(...nodeBindings) {
    if (nodeBindings.length === 0) return;
    const elements = nodeBindings.map((binding) => binding.getNativeNode());
    this.#node.after(...elements);
  }

  detach() {
    this.#node.remove();
  }

  remove(child) {
    this.#node.removeChild(child);
  }

  insert(position, nodeBinding) {
    const element = nodeBinding.getNativeNode();
    const elementRef = this.#node.children[position];
    if (elementRef) this.#node.insertBefore(element, elementRef);
    else this.#node.append(element);
  }

  replaceWith(binding) {
    this.#node.replaceWith(binding.getNativeNode());
  }

  replace(position, nodeBinding) {
    const element = nodeBinding.getNativeNode();
    const replaceElement = this.#node.children[position];
    if (replaceElement) replaceElement.replaceWith(element);
    else this.#node.append(element);
  }

  toggleClass(className, force) {
    this.#node.classList.toggle(className, force);
  }

  setClasses(value) {
    if (!is.str(value) && !is.arr(value)) return;
    const existingClasses = Array.from(this.#node.classList);
    const getSystemClasses = (clazz) => clazz.startsWith(CLASS_PREFIX);
    const systemClasses = existingClasses.filter(getSystemClasses);
    const classes = is.str(value) ? value.split(' ') : value;
    this.#node.className = systemClasses.concat(classes).join(' ');
  }
}

export class DocumentBinding extends NodeBinding {
  constructor(webApi, schema) {
    super(webApi, schema, webApi.document);
  }
}

export class FragmentBinding extends NodeBinding {
  constructor(webApi, schema) {
    const fragment = webApi.document.createDocumentFragment();
    super(webApi, schema, fragment);
  }
}

export class TextBinding extends NodeBinding {
  constructor(webApi, schema) {
    const text = webApi.document.createTextNode(schema);
    super(webApi, schema, text);
  }
}

export class ElementBinding extends NodeBinding {
  constructor(webApi, schema, existing) {
    const element = existing || webApi.document.createElement(schema.tag);
    super(webApi, schema, element);
    this.isHydrated = !!existing;
    this.setText(schema.text);
    this.setClasses(schema.classes);
    this.setProperties(schema.props);
    this.setAttributes(schema.attrs);
  }
}
