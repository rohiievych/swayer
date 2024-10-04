const BASIC_PRIMITIVES = ['string', 'boolean', 'number', 'bigint', 'symbol'];

const is = {
  obj: (value) => typeof value === 'object' && value !== null,
  emptyObj: (value) => is.obj(value) && Object.keys(value).length === 0,
  date: (value) => value instanceof Date,
  arr: (value) => Array.isArray(value),
  fn: (value) => typeof value === 'function',
  str: (value) => typeof value === 'string',
  num: (value) => typeof value === 'number',
  basic: (value) => BASIC_PRIMITIVES.includes(typeof value),
  nullish: (value) => value === undefined || value === null,
};

const isFalsyValue = (value) => is.nullish(value)
  || value === ''
  || value === false;

const hasOwn = (object, prop) => Object.hasOwn?.(object, prop)
  ?? Object.prototype.hasOwnProperty.call(object, prop);

const isEnumerable = (object, prop) =>
  Object.prototype.propertyIsEnumerable.call(object, prop);

const equal = (a, b, objectGetter) => {
  if (a === b) return true;
  if (is.fn(a) && is.fn(b)) return a.toString() === b.toString();
  if (is.obj(a) && is.obj(b)) {
    if (is.fn(objectGetter)) {
      a = objectGetter(a);
      b = objectGetter(b);
    }
    if (a.constructor !== b.constructor) return false;
    let length, index;
    if (is.arr(a)) {
      length = a.length;
      if (length !== b.length) return false;
      index = length;
      while (index--) {
        if (!equal(a[index], b[index], objectGetter)) return false;
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
      if (!equal(a[key], b[key], objectGetter)) return false;
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

// deep-object-diff fork
const diff = (lhs, rhs, options = { keepFunctionsChanged: false }) => {
  // Original comparison
  // if (lhs === rhs) return {};
  // Account primitives only to dive into objects
  if (is.basic(lhs) && is.basic(rhs) && lhs === rhs) return {};

  if (!is.obj(lhs) || !is.obj(rhs)) return rhs;

  if (is.date(lhs) || is.date(rhs)) {
    return lhs.valueOf() === rhs.valueOf() ? {} : rhs;
  }
  const result = {};
  // Handle deletions or undefined properties
  for (const key of Object.keys(lhs)) {
    if (!hasOwn(rhs, key)) result[key] = undefined;
  }
  // Handle additions, changes, and deep differences
  for (const key of Object.keys(rhs)) {
    if (!hasOwn(lhs, key)) {
      result[key] = rhs[key];
      continue;
    }
    if (is.fn(lhs[key]) || is.fn(rhs[key])) {
      // Determine function change based on the parameter
      if (options.keepFunctionsChanged) result[key] = rhs[key];
      else if (lhs[key] !== rhs[key]) result[key] = rhs[key];
    } else {
      const valueDiff = diff(lhs[key], rhs[key], options);
      if (!is.emptyObj(valueDiff)) result[key] = valueDiff;
    }
  }
  return result;
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
  isFalsyValue,
  hasOwn,
  isEnumerable,
  equal,
  mergeDeep,
  diff,
  camelToKebabCase,
  normalizePath,
  isBrowser,
  isServer,
};
