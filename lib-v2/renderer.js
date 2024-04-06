import diff from '../node_modules/deep-object-diff/mjs/diff.js';
import {
  DATA_ATTR_NAME,
  FRAG_PLACEHOLDER,
  FRAG_RANGE_END,
  FRAG_RANGE_START,
  NODE_SCHEMA,
} from './constants.js';
import { camelToKebabCase, hasOwn, is } from './utils.js';

const isNode = {
  text: (node) => node.nodeType === Node.TEXT_NODE,
  element: (node) => node.nodeType === Node.ELEMENT_NODE,
  comment: (node) => node.nodeType === Node.COMMENT_NODE,
};

// Check if node corresponds to schema tag or text
const checkNode = (node, schema) => {
  if (!node || is.nullish(schema)) return false;
  const isTxtNode = isNode.text(node);
  if (isTxtNode && is.basic(schema)) {
    return node.textContent === schema.toString();
  }
  return node.nodeName.toLowerCase() === schema.tag;
};

const isEmptyValue = (value) => is.nullish(value)
  || value === ''
  || value === false;

const setElementText = (node, text) => {
  if (is.nullish(text)) text = '';
  else if (!is.str(text)) text = text.toString();
  const existing = node.textContent;
  if (existing !== text) node.textContent = text;
};

const setElementInlineStyle = (element, props) => {
  if (!is.obj(props)) return;
  for (const [prop, value] of Object.entries(props)) {
    element.style[prop] = value;
  }
};

const setElementAttr = (element, name, value) => {
  if (is.fn(value)) return;
  const attr = camelToKebabCase(name);
  if (attr === 'style') setElementInlineStyle(element, value);
  else if (value === true) element.setAttribute(attr, '');
  else if (isEmptyValue(value)) element.removeAttribute(attr);
  else element.setAttribute(attr, value);
};

const setElementAttrs = (element, attrs) => {
  const attrNames = element.getAttributeNames();
  if (isEmptyValue(attrs)) {
    for (const name of attrNames) element.removeAttribute(name);
    return;
  }
  for (const name of attrNames) {
    const hasAttr = hasOwn(attrs, name);
    const isMandatoryAttr = name.startsWith(DATA_ATTR_NAME) || name === 'class';
    const redundant = !hasAttr && !isMandatoryAttr;
    if (redundant) element.removeAttribute(name);
  }
  const attrPairs = Object.entries(attrs);
  for (const pair of attrPairs) setElementAttr(element, ...pair);
};

// Preserves initial fragment index
const appendFragmentPlaceholder = (parentElement) => {
  const fragmentPlaceholder = new Comment(FRAG_PLACEHOLDER);
  parentElement.append(fragmentPlaceholder);
};

// STAGE 1: render component template
const createComponent = (schema) => {
  let templateNode;

  /** @type {any} */
  let stack = [{
    schema,
    parentElement: null,
    indexPath: [],
  }];

  if (is.arr(schema)) {
    templateNode = new DocumentFragment();
    stack = schema.map((schemaItem, i) => ({
      schema: schemaItem,
      parentElement: templateNode,
      indexPath: [i],
    })).reverse();
  }

  const bindings = new Map();

  while (stack.length > 0) {
    const { schema, parentElement, indexPath } = stack.pop();

    if (isEmptyValue(schema)) continue;

    // Collect bindings
    const binding = new Map();

    // Dynamic fragment schema
    if (is.fn(schema)) {
      const indices = indexPath.slice(0, -1);
      const startIndex = indexPath[indexPath.length - 1];
      binding.set(['children', startIndex], schema);
      bindings.set(indices, binding);
      appendFragmentPlaceholder(parentElement);
      continue;
    }
    // Primitive schemas (strings, numbers, symbols)
    if (is.basic(schema)) {
      const text = document.createTextNode(schema);
      binding.set(['text'], schema);
      setElementText(text, schema);
      parentElement.append(text);
      continue;
    }

    const element = document.createElement(schema.tag);
    const { text, attrs, classes } = schema;

    if (is.fn(text)) binding.set(['text'], text);
    else setElementText(element, text);

    if (is.fn(attrs)) {
      binding.set(['attrs'], attrs);
    } else if (is.obj(attrs)) {
      for (const [attr, value] of Object.entries(attrs)) {
        if (is.fn(value)) binding.set(['attrs', attr], value);
        else setElementAttr(element, attr, value);
      }
    }

    if (is.fn(classes)) binding.set(['classes'], classes);
    else if (is.str(classes)) setElementAttr(element, 'class', classes);

    const children = schema.children;
    if (is.fn(children)) {
      binding.set(['children'], children);
      appendFragmentPlaceholder(element);

    } else if (is.arr(children)) {
      for (let i = children.length - 1; i >= 0; --i) {
        stack.push({
          schema: children[i],
          parentElement: element,
          indexPath: [...indexPath, i],
        });
      }
    }

    if (binding.size > 0) bindings.set(indexPath, binding);
    if (parentElement) parentElement.append(element);
    else templateNode = element;
  }

  return { templateNode, bindings };
};

// Skip 'children' path segment if children is obj or arr
const resolveUpdatePath = (prop, value, path) => {
  if (prop === 'children') {
    if (is.arr(value) || is.obj(value)) return path;
  }
  return [...path, prop];
};

// Do not include deep updates if parent tag is changed
// This reduces unnecessary updates as parent is fully replaced
const optimizeUpdates = (path, results) => {
  const len = results.length;
  if (len === 0) return false;
  const [index, prop] = results[len - 1];
  const nextIndex = path[0];
  return index === nextIndex && prop === 'tag';
};

// Convert diffs to update paths
const exploreUpdates = (obj, path = [], results = []) =>
  Object.entries(obj).reduce((results, [key, val]) => {
    const newPath = resolveUpdatePath(key, val, path);
    if (optimizeUpdates(newPath, results)) return results;
    if (is.obj(val)) return exploreUpdates(val, newPath, results);
    else if (isEmptyValue(val)) results.push(newPath);
    else results.push([...newPath, val]);
    return results;
  }, results);

// Split indexPaths (node drilling) and propPaths (node props to update)
const splitUpdatePath = (updatePath) => {
  const indexPaths = [];
  const pathLen = updatePath.length;
  for (let i = 0; i < pathLen; ++i) {
    const item = +updatePath[i];
    if (isNaN(item)) return [indexPaths, updatePath.slice(i)];
    indexPaths.push(item);
  }
  return [indexPaths, []];
};

// Get schema diffs
const getUpdatePaths = (prevSchema, curSchema) => {
  const diffs = diff(prevSchema, curSchema);
  const updatePaths = exploreUpdates(diffs);
  return updatePaths.map(splitUpdatePath);
};

// Make element in fragment by index path
const makeBoundNode = (rootNode, schema, state, indexPath) => {
  // Collect removals to prevent incorrect childNode indexing
  const removals = [];
  let node = rootNode;
  let currentSchema = schema;
  for (const index of indexPath) {
    if (is.arr(currentSchema)) {
      currentSchema = currentSchema[index];
    } else if (is.obj(currentSchema) && hasOwn(currentSchema, 'children')) {
      currentSchema = currentSchema.children[index];
    }
    const child = node.childNodes[index];
    if (checkNode(child, currentSchema)) {
      node = child;
    } else if (child) {
      const renderResult = render(currentSchema, state);
      if (isEmptyValue(renderResult)) removals.push(() => child.remove());
      else child.replaceWith(renderResult);
      return [renderResult, removals];
    } else if (isNode.element(node)) {
      const renderResult = render(currentSchema, state);
      node.append(renderResult);
      return [renderResult, removals];
    }
  }
  return [node, removals];
};

const applyTopNodeUpdates = (node, schema, state) => {
  if (isEmptyValue(schema)) {
    node.remove();
    return true;
  }
  if (!checkNode(node, schema)) {
    const newNode = render(schema, state);
    node.replaceWith(newNode);
    return true;
  }
  return false;
};

const applyNodeUpdates = (node, schema, updatePaths, state) => {
  const removeActions = [];
  for (const path of updatePaths) {
    const [indexPath, propPath] = path;
    const [prop, nestedProp, value] = propPath;
    const [boundNode, removals] = makeBoundNode(node, schema, state, indexPath);
    if (removals.length > 0) removeActions.push(...removals);
    if (!boundNode) continue;
    const actions = makeUpdateActions(boundNode, state);
    if (!hasOwn(actions, prop)) continue;
    const action = actions[prop];
    const noVal = value === undefined;
    const val = noVal ? nestedProp : value;
    const nested = noVal ? undefined : nestedProp;
    const updatedVal = is.fn(val) ? val(state) : val;
    const updateChildren = action(updatedVal, nested);
    // Replaces existing node with fragment
    if (updateChildren) updateChildren();
  }
  for (const action of removeActions) action();
};

const updateFragment = (inputSchema, parentNode, data, fragRange) => {
  const children = parentNode.childNodes;
  const dataLength = data.length;
  const schemas = is.arr(inputSchema) ? inputSchema : [inputSchema];
  const schemasLength = schemas.length;
  const { startOffset, endOffset } = fragRange;
  const fragEndNode = children[endOffset];
  let start = startOffset;
  let end = start;
  // Update nodes
  for (let i = 0; i < dataLength; ++i) {
    const state = data[i];
    let schemaIndex = 0;
    start = i * schemasLength + startOffset;
    end = start + schemasLength;
    // Iterate fragment nodes
    for (let j = start; j < end; ++j) {
      const childNode = children[j];
      schemaIndex = j - start;
      // Append new nodes to fragment if schemas run out of range
      if (start + schemaIndex >= endOffset || !childNode) {
        // Append only remaining part of schemas
        const part = schemaIndex > 0 ? schemas.slice(schemaIndex) : schemas;
        const newNode = render(part, state);
        if (newNode) fragEndNode.before(newNode);
        break;
      }
      const schema = schemas[schemaIndex];
      // Apply high level replacements
      const isApplied = applyTopNodeUpdates(childNode, schema, state);
      if (isApplied) continue;
      const prevSchemas = childNode[NODE_SCHEMA];
      const prevSchema = is.arr(prevSchemas)
        ? prevSchemas[schemaIndex]
        : prevSchemas;
      const updatePaths = getUpdatePaths(prevSchema, schema);
      // Apply updates
      applyNodeUpdates(childNode, schema, updatePaths, state);
      // Update node schema
      childNode[NODE_SCHEMA] = inputSchema;
    }
  }
  // Remove trailing nodes
  if (end < endOffset) {
    const range = new Range();
    range.setStart(parentNode, end);
    range.setEnd(parentNode, endOffset);
    range.deleteContents();
  }
};

// Calculate node range using comment markers
const getFragmentRange = (parentElement, index) => {
  const nodes = parentElement.childNodes;
  const nodesLength = nodes.length;
  let range;
  for (let i = 0; i < nodesLength; ++i) {
    const child = nodes[i];
    if (!isNode.comment(child) && child.data !== FRAG_PLACEHOLDER) continue;
    const [marker, fragIndex] = child.data.split(':');
    if (+fragIndex !== index) continue;
    if (marker === FRAG_RANGE_START) {
      range = new Range();
      range.setStartAfter(child);
    } else if (range && marker === FRAG_RANGE_END) {
      range.setEndBefore(child);
      break;
    }
  }
  return range;
};

const renderFragment = (schema, index, data) => {
  const fragment = new DocumentFragment();
  // Mark fragment
  const start = new Comment(`${FRAG_RANGE_START}:${index}`);
  const end = new Comment(`${FRAG_RANGE_END}:${index}`);
  // First read
  const nodes = (is.arr(data)
    ? data.map((datum) => render(schema, datum))
    : [render(schema, data)])
  .filter((node) => !isEmptyValue(node));
  // Then write
  fragment.append(start, ...nodes, end);
  return fragment;
};

const prepareFragmentInsertion = (parentElement, fragment, index) => {
  const children = parentElement.childNodes;
  // Index is preserved using swr-frag-placeholder comment
  const fragmentPlaceholder = children[index];
  return () => fragmentPlaceholder.replaceWith(fragment);
};

const renderChildren = (schema, parentElement, fragmentIndex, data) => {
  const range = getFragmentRange(parentElement, fragmentIndex);
  if (range) return updateFragment(schema, parentElement, data, range);
  const fragment = renderFragment(schema, fragmentIndex, data);
  return prepareFragmentInsertion(parentElement, fragment, fragmentIndex);
};

// Remove empty schema values
const cleanSchema = (schema) => {
  if (!is.obj(schema)) return schema;
  if (is.arr(schema)) {
    return schema.reduce((acc, item) => {
      if (!isEmptyValue(item)) acc.push(cleanSchema(item));
      return acc;
    }, []);
  }
  const result = {};
  for (const [key, value] of Object.entries(schema)) {
    if (isEmptyValue(value)) continue;
    // Create new bindings to differ similar nodes
    if (is.fn(value)) result[key] = value.bind(schema);
    else result[key] = cleanSchema(value);
  }
  return result;
};

// Define schema to node update mapping
const makeUpdateActions = (parentElement, defaultState) => ({
  // tag: (value) => replaceNode(parentElement, value),
  text: (value) => setElementText(parentElement, value),
  classes: (value) => setElementAttr(parentElement, 'class', value),
  attrs: (value, nestedProp) => {
    if (nestedProp) setElementAttr(parentElement, nestedProp, value);
    else setElementAttrs(parentElement, value);
  },
  children: (value, nestedProp) => {
    if (isEmptyValue(value)) return;
    let schema = value;
    let data = [defaultState];
    if (hasOwn(value, 'of')) {
      ({ schema, of: data } = value);
    } else if (hasOwn(value, 'args')) {
      ({ schema } = value);
      data = [value.args];
    }
    const cleanedSchema = cleanSchema(schema);
    const index = nestedProp || 0;
    return renderChildren(cleanedSchema, parentElement, index, data);
  },
});

// STAGE 2: render component bindings
const renderComponent = (rootNode, schema, bindings, state) => {
  const fragmentInsertions = [];
  for (const [indexPath, binding] of bindings) {
    const [parentNode] = makeBoundNode(rootNode, schema, state, indexPath);
    const actions = makeUpdateActions(parentNode, state);
    // Render bound props
    for (const [propPath, binder] of binding) {
      const [prop, nestedProp] = propPath;
      if (!hasOwn(actions, prop)) continue;
      const action = actions[prop];
      const insertion = action(binder(state), nestedProp);
      if (insertion) fragmentInsertions.push(insertion);
    }
  }
  // Apply fragment insertions
  for (const insertion of fragmentInsertions) insertion();
  return rootNode;
};

const componentTemplates = new WeakMap();

const getComponent = (schema) => {
  const component = componentTemplates.get(schema);
  if (component) return component;
  const newComponent = createComponent(schema);
  componentTemplates.set(schema, newComponent);
  return newComponent;
};

const assignComponentSchema = (node, schema) => {
  if (hasOwn(node, NODE_SCHEMA)) return;
  const cleanedSchema = cleanSchema(schema);
  node[NODE_SCHEMA] = cleanedSchema;
  if (node.constructor.name === 'DocumentFragment') {
    const children = node.childNodes;
    const len = children.length;
    for (let i = 0; i < len; ++i) children[i][NODE_SCHEMA] = cleanedSchema;
  }
};

export const render = (schema, state, rootNode) => {
  if (is.nullish(schema) || is.basic(schema)) return schema;
  const { templateNode, bindings } = getComponent(schema);
  const componentNode = rootNode || templateNode.cloneNode(true);
  assignComponentSchema(componentNode, schema);
  return renderComponent(componentNode, schema, bindings, state);
};
