import { equal, hasOwn, is, isEnumerable } from './utils.js';

const REACTIVE = Symbol('reactive');
const TARGET = Symbol('target');

class Dependency {
  #reactions = new Map();
  #ref;

  static deps = new WeakMap();
  static #target = null;
  static #updateBatch = new Map();

  constructor(ref) {
    this.#ref = ref;
  }

  static invoke(target) {
    this.#target = target;
    const result = target.update();
    this.#target = null;
    return result;
  }

  static get(ref, key) {
    return Dependency.deps.get(ref)?.get(key);
  }

  static obtain(ref, key) {
    let dep;
    const map = Dependency.deps.get(ref);
    if (map) {
      dep = map.get(key);
      if (!dep) map.set(key, dep = new Dependency(ref));
    } else {
      const map = new Map();
      map.set(key, dep = new Dependency(ref));
      Dependency.deps.set(ref, map);
    }
    return dep;
  }

  static deref(ref, force = false) {
    const dep = Dependency.deps.get(ref);
    if (!dep) return false;
    if (force) return Dependency.deps.delete(ref);
    const refDeps = Array.from(dep.values());
    const isGarbageRef = refDeps.every((dep) => dep.reactions.size === 0);
    return isGarbageRef ? Dependency.deps.delete(ref) : false;
  }

  static delete(ref, key) {
    const dep = Dependency.deps.get(ref);
    return dep ? dep.delete(key) : false;
  }

  get reactions() {
    return this.#reactions;
  }

  depend() {
    const target = Dependency.#target;
    if (target === null) return;
    if (hasOwn(target, 'update')) this.#set(target);
    else this.#remove(target);
  }

  notify() {
    const batch = Dependency.#updateBatch;
    for (const entry of this.#reactions) batch.set(...entry);
    if (batch.size === 1) {
      // Batch updates
      queueMicrotask(() => {
        const updates = batch.values();
        for (const update of updates) update();
        batch.clear();
      });
    }
  }

  cloneReactionsFrom(dep) {
    this.#reactions = new Map(dep.reactions);
  }

  #set(target) {
    const { reaction, update } = target;
    if (this.#reactions.has(reaction)) return;
    this.#reactions.set(reaction, update);
  }

  #remove(target) {
    const { reaction } = target;
    this.#reactions.delete(reaction);
    Dependency.deref(this.#ref);
  }
}

class DependencyHandler {
  static get(target, key) {
    Dependency.obtain(target, key).depend();
  }

  static set(target, key, replaced, value) {
    if (is.obj(replaced)) {
      const replacedTarget = replaced[TARGET];
      // Transfer reactivity to new array
      if (is.arr(value)) {
        const newArray = value[TARGET];
        const dep = DependencyHandler.notify(replacedTarget, 'length');
        if (!dep) return;
        // Clone length dep to new array to continue tracking
        Dependency.obtain(newArray, 'length').cloneReactionsFrom(dep);
        // Clean replaced array to free memory
        Dependency.deref(replacedTarget, true);
        for (const item of replacedTarget) Dependency.deref(item[TARGET], true);
        return;
      }
      Dependency.deref(replacedTarget, true);
    }
    DependencyHandler.notify(target, key);
  }

  static deleteProperty(target, key, value) {
    DependencyHandler.notify(target, key);
    Dependency.delete(target, key);
    Dependency.deref(target);
    if (is.obj(value)) Dependency.deref(value[TARGET], true);
  }

  static notify(target, key) {
    const dep = Dependency.get(target, key);
    // Dependency might not exist if there are no reactions for state data
    if (dep) dep.notify();
    return dep;
  }

  static compare(newValue, oldValue) {
    const objectGetter = (obj) => obj[TARGET] || obj;
    return equal(newValue, oldValue, objectGetter);
  }
}

class ProxyHandler {
  #activator;

  constructor(dataActivator) {
    this.#activator = dataActivator;
  }

  get(target, key, receiver) {
    const isChecked = this.#checkKey(target, key);
    if (isChecked) DependencyHandler.get(target, key);
    return Reflect.get(target, key, receiver);
  }

  set(target, key, value, receiver) {
    const replaced = target[key];
    const isArrayLen = is.arr(target) && key === 'length';
    if (!isArrayLen && DependencyHandler.compare(value, replaced)) return true;
    if (is.obj(value)) value = this.#activator.activate(value);
    const isSet = Reflect.set(target, key, value, receiver);
    const isChecked = this.#checkKey(target, key);
    if (isChecked) DependencyHandler.set(target, key, replaced, value);
    return isSet;
  }

  deleteProperty(target, key) {
    if (!hasOwn(target, key)) return true;
    this.#activator.deactivate(target, key);
    const value = target[key];
    const isChecked = this.#checkKey(target, key);
    const isDeleted = Reflect.deleteProperty(target, key);
    if (isChecked) DependencyHandler.deleteProperty(target, key, value);
    return isDeleted;
  }

  #checkKey(target, key) {
    // Allow array length deps
    const isEnum = isEnumerable(target, key) || key === 'length';
    if (!isEnum) return false;
    // Optimize array reactivity by skipping array index deps
    const isIndex = is.arr(target) && !isNaN(parseInt(key, 10));
    return !isIndex;
  }
}

class DataActivator {
  static #registry = new WeakMap();

  static #createRefDescriptor(value) {
    return {
      value,
      writable: false,
      configurable: false,
      enumerable: false,
    };
  }

  static #defineDataRefs(target, proxy) {
    const proxyDescriptor = this.#createRefDescriptor(proxy);
    const targetDescriptor = this.#createRefDescriptor(target);
    Reflect.defineProperty(target, REACTIVE, proxyDescriptor);
    Reflect.defineProperty(target, TARGET, targetDescriptor);
  }

  static activate(data) {
    if (hasOwn(data, REACTIVE)) return data[REACTIVE];
    for (const key of Object.keys(data)) {
      const value = data[key];
      if (is.obj(value)) data[key] = this.activate(value);
    }
    const proxyHandler = new ProxyHandler(this);
    const proxy = new Proxy(data, proxyHandler);
    this.#registry.set(proxy, data);
    DataActivator.#defineDataRefs(data, proxy);
    return proxy;
  }

  static deactivate(data, key) {
    const value = data[key];
    if (this.#registry.has(value)) this.#registry.delete(value);
    for (const k of Object.keys(value)) {
      if (is.obj(value[k])) this.deactivate(value, k);
    }
  }
}

export default class Reactivity {
  #reactions = new WeakSet();

  static activate(state) {
    return DataActivator.activate(state);
  }

  // GC collects all reactions from weak set, so no need to unregister
  register(reaction, update) {
    if (this.#reactions.has(reaction)) return update();
    this.#reactions.add(reaction);
    const target = { reaction, update };
    return Dependency.invoke(target);
  }
}

// Debug deps
// setInterval(() => {
//   console.log(Dependency.deps);
// }, 3890);
