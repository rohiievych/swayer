const BASIC_PRIMITIVES = ['string', 'boolean', 'number', 'bigint', 'symbol'];

const is = {
  obj: (value) => typeof value === 'object' && value !== null,
  arr: (value) => Array.isArray(value),
  fn: (value) => typeof value === 'function',
  str: (value) => typeof value === 'string',
  num: (value) => typeof value === 'number',
  basic: (value) => BASIC_PRIMITIVES.includes(typeof value),
  nullish: (value) => value === undefined || value === null,
};

const hasOwn = (object, prop) => Object.hasOwn?.(object, prop)
  ?? Object.prototype.hasOwnProperty.call(object, prop);

const isEnumerable = (object, prop) =>
  Object.prototype.propertyIsEnumerable.call(object, prop);

const equal = (a, b) => {
  if (a === b) return true;
  if (is.fn(a) && is.fn(b)) return a.toString() === b.toString();
  if (is.obj(a) && is.obj(b)) {
    if (a.constructor !== b.constructor) return false;
    let length, index;
    if (is.arr(a)) {
      length = a.length;
      if (length !== b.length) return false;
      index = length;
      while (index--) {
        if (!equal(a[index], b[index])) return false;
      }
      return true;
    }
    const keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;
    index = length;
    while (index--) {
      if (!hasOwn(b, keys[index])) return false;
    }
    index = length;
    while (index--) {
      const key = keys[index];
      if (!equal(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
};

const mergeDeep = (target, source) => {
  if (!is.obj(target) || !is.obj(source)) return source;
  Object.keys(source).forEach((key) => {
    const targetValue = target[key];
    const sourceValue = source[key];
    if (is.arr(targetValue) && is.arr(sourceValue)) {
      target[key] = targetValue.concat(sourceValue);
    } else if (is.obj(targetValue) && is.obj(sourceValue)) {
      target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });
  return target;
};

const camelToKebabCase = (() => {
  const camelCasePattern = /[A-Z]/g;
  const replacer = (letter) => `-${letter.toLowerCase()}`;
  return (str) => str.replace(camelCasePattern, replacer);
})();

const normalizePath = (path, sep = '/') => {
  const normalPath = path.split(sep).filter((seg) => seg !== '').join(sep);
  if (path.startsWith(sep)) return sep + normalPath;
  return normalPath;
};

const isBrowser = hasOwn(globalThis, 'document');
const isServer = hasOwn(globalThis, 'process');

export {
  is,
  hasOwn,
  isEnumerable,
  equal,
  mergeDeep,
  camelToKebabCase,
  normalizePath,
  isBrowser,
  isServer,
};
