import Reactivity from './reactivity.js';
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
    const { schema, component } = this.#context;

    this.#addPropReactivity(component, 'text', schema.text);
    this.#addPropReactivity(component, 'classes', schema.classes);

    const props = schema.props;
    this.#addPropReactivity(component, 'props', props);
    this.#addObjectReactivity(component, 'props', props);

    const attrs = schema.attrs;
    this.#addPropReactivity(component, 'attrs', attrs);
    this.#addObjectReactivity(component, 'attrs', attrs);
    this.#addObjectReactivity(component.attrs, 'style', attrs?.style);

    // Make reactive only styles ref and styles.compute for performance reasons
    const styles = schema.styles;
    this.#addPropReactivity(component, 'styles', styles);
    this.#addPropReactivity(component.styles, 'compute', styles?.compute);
    this.#addObjectReactivity(component.styles, 'compute', styles?.compute);
  }

  registerChildren(source) {
    const { schema: { children } } = this.#context;
    if (source === children) {
      return this.#reactivity.register(this.#context, 'children', children);
    }
    const index = children.indexOf(source);
    return this.#reactivity.register(this.#context.children, index, source);
  }

  removeReactivity() {
    const schema = this.#context.schema;
    this.#reactivity.unregister(schema.text);
    this.#removeObjectReactivity(schema.attrs);
    this.#removeObjectReactivity(schema.attrs?.style);
    this.#removeObjectReactivity(schema.props);
    this.#reactivity.unregister(schema.styles);
    this.#removeObjectReactivity(schema.styles?.compute);
    this.#removeObjectReactivity(schema.children);
  }

  #activateState() {
    const { schema, component, module } = this.#context;
    if (schema.model) {
      component.model.state = Reactivity.activate(schema.model.state);
    } else if (module.schema.model) {
      component.model = module.schema.model;
    }
  }

  #addPropReactivity(target, prop, source) {
    if (!is.fn(source)) return;
    target[prop] = this.#reactivity.register(target, prop, source);
  }

  #addObjectReactivity(target, prop, source) {
    if (!is.obj(source)) return;
    const propTarget = target[prop];
    for (const [key, value] of Object.entries(source)) {
      this.#addPropReactivity(propTarget, key, value);
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
    const init = Component.#shallow;
    const schema = this.#context.schema;
    this.tag = schema.tag;
    this.model = schema.model;
    this.text = schema.text;
    this.classes = schema.classes;
    this.styles = init(schema.styles);
    this.styles.compute = init(schema.styles?.compute, []);
    this.attrs = init(schema.attrs);
    this.attrs.style = init(schema.attrs?.style);
    this.props = init(schema.props);
    this.events = init(schema.events);
    this.hooks = schema.hooks || {};
    this.channels = init(schema.channels);
  }

  static #shallow(schemaValue, container = {}) {
    return is.obj(schemaValue)
      ? { ...container, ...schemaValue }
      : container;
  }
}
