import { COMPUTED_STYLE_TYPE, STATIC_STYLE_TYPE } from './constants.js';
import Reactivity from './reactivity.js';
import Reporter from './reporter.js';
import { is } from './utils.js';

export class ReactivityManager {
  #context;
  #reactivity;

  constructor(context) {
    this.#context = context;
    this.#reactivity = new Reactivity(context.component);
    this.#activateState();
  }

  registerReactivity() {
    const { schema, binding } = this.#context;

    const setText = (val) => binding.setText(val);
    const setClasses = (val) => {
      const systemClasses = this.#context.getSystemClassNames();
      binding.setClasses(val, systemClasses);
    };
    const setAttrs = (val) => binding.setAttributes(val);
    const setAttr = (key, val) => binding.setAttribute(key, val);
    const setStyle = (key, val) => binding.setInlineStyleProperty(key, val);
    // Enable if necessary to bind node properties
    // const setProps = (val) => binding.setProperties(val);
    // const setProp = (key, val) => binding.setProperty(key, val);

    this.#registerProp(schema.text, setText);
    this.#registerProp(schema.classes, setClasses);
    this.#registerProp(schema.attrs, setAttrs);
    this.#registerObj(schema.attrs, setAttr);
    this.#registerObj(schema.attrs?.style, setStyle);
    // Enable if necessary to bind node properties
    // this.#registerProp(schema.props, setProps);
    // this.#registerObj(schema.props, setProp);

    this.#registerStyles();
  }

  registerChildren(sourceFn) {
    const renderer = this.#context.renderer;
    const { schema: { children }, component } = this.#context;
    const model = component.model;
    if (is.nullish(model)) throw Reporter.error('ModelNotFound', sourceFn);
    const reaction = () => sourceFn(model.state);
    if (sourceFn === children) {
      const update = () => renderer.renderChildren(reaction());
      return this.#reactivity.register(sourceFn, reaction, update);
    }
    const index = children.indexOf(sourceFn);
    const update = () => renderer.renderSegment(reaction(), index);
    return this.#reactivity.register(sourceFn, reaction, update);
  }

  removeReactivity() {
    const schema = this.#context.schema;
    this.#reactivity.unregister(schema.text);
    this.#reactivity.unregister(schema.classes);
    this.#removeObjectReactivity(schema.attrs);
    this.#removeObjectReactivity(schema.attrs?.style);
    this.#removeObjectReactivity(schema.props);
    this.#reactivity.unregister(schema.styles);
    this.#removeObjectReactivity(schema.styles?.compute);
    this.#removeObjectReactivity(schema.children);
  }

  #registerStyles() {
    const {
      schema,
      binding,
      stylers,
      styleClasses: classes,
    } = this.#context;
    const styler = stylers[STATIC_STYLE_TYPE];
    const changeStyles = (value) => {
      const prevClass = classes.static;
      const newClass = styler.changeStyles(binding, prevClass, value);
      this.#context.setSystemClass('static', newClass);
    };
    const compStyler = stylers[COMPUTED_STYLE_TYPE];
    const changeComputedStyles = (value) => {
      const prevClass = classes.computed;
      const newClass = compStyler.changeStyles(binding, prevClass, value);
      this.#context.setSystemClass('computed', newClass);
    };
    const changeMultipleComputedStyles = (index, value) => {
      const prevClass = classes.computedArray[index];
      const newClass = compStyler.changeStyles(binding, prevClass, value);
      this.#context.setSystemClass('computedArray', newClass, index);
    };
    const stylesSrc = schema.styles;
    this.#registerProp(stylesSrc, changeStyles);
    this.#registerProp(stylesSrc?.compute, changeComputedStyles);
    this.#registerObj(stylesSrc?.compute, changeMultipleComputedStyles);
  }

  #registerProp(sourceFn, updateFn) {
    if (!is.fn(sourceFn)) return;
    const model = this.#context.component.model;
    if (is.nullish(model)) throw Reporter.error('ModelNotFound', sourceFn);
    const react = () => sourceFn(model.state);
    const updater = () => updateFn(react());
    const res = this.#reactivity.register(sourceFn, react, updater);
    updateFn(res);
  }

  #registerObj(sourceObj, updateFn) {
    if (!is.obj(sourceObj)) return;
    for (const [key, valueSrc] of Object.entries(sourceObj)) {
      this.#registerProp(valueSrc, (value) => updateFn(key, value));
    }
  }

  #activateState() {
    const { schema, component, module } = this.#context;
    if (schema.model) {
      component.model.state = Reactivity.activate(schema.model.state);
    } else if (module.schema.model) {
      component.model = module.schema.model;
    }
  }

  #removeObjectReactivity(source) {
    if (!source) return;
    this.#reactivity.unregister(source);
    for (const value of Object.values(source)) {
      this.#reactivity.unregister(value);
    }
  }
}

export class Component {
  #context;

  constructor(context) {
    this.#context = context;
    this.#setup();
  }

  get moduleUrl() {
    return this.#context.module.url;
  }

  get router() {
    const router = this.#context.router;
    return {
      go: (path) => router.go(path),
    };
  }

  emitMessage(channelName, data, options) {
    this.#context.channelManager.emitMessage(channelName, data, options);
  }

  emitEvent(eventName, data = null) {
    return this.#context.eventManager.emitEvent(eventName, data);
  }

  click() {
    this.#context.binding.click();
  }

  focus() {
    this.#context.binding.focus();
  }

  blur() {
    this.#context.binding.blur();
  }

  #setup() {
    this.model = this.#context.schema.model;
  }
}
