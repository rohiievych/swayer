import {
  DATA_ATTR_NAME,
  FRAG_PLACEHOLDER,
  FRAG_RANGE_END,
  FRAG_RANGE_START,
  NODE_SCHEMA,
  SCHEMA_ARGS_DATA,
  SCHEMA_ATTRS,
  SCHEMA_CHILDREN,
  SCHEMA_CLASSES,
  SCHEMA_COMPONENT,
  SCHEMA_MODEL,
  SCHEMA_MODEL_STATE,
  SCHEMA_OF_DATA,
  SCHEMA_TAG,
  SCHEMA_TEXT,
} from './constants.js';
import { camelToKebabCase, diff, hasOwn, is } from './utils.js';

const isNode = {
  text: (node) => node.nodeType === Node.TEXT_NODE,
  element: (node) => node.nodeType === Node.ELEMENT_NODE,
  comment: (node) => node.nodeType === Node.COMMENT_NODE,
  fragment: (node) => node.nodeType === Node.DOCUMENT_FRAGMENT_NODE,
};

// Check if node corresponds to schema tag or text
const checkNode = (node, schema) => {
  if (!node || is.nullish(schema)) return false;
  const isTxtNode = isNode.text(node);
  if (isTxtNode && is.basic(schema)) {
    return node.textContent === schema.toString();
  }
  return node.nodeName.toLowerCase() === schema[SCHEMA_TAG];
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

// Remove empty schema values
const cleanseSchema = (schema) => {
  if (!is.obj(schema)) return schema;
  if (is.arr(schema)) {
    const len = schema.length;
    for (let i = 0; i < len; ++i) {
      const item = schema[i];
      if (isEmptyValue(item)) schema.splice(i, 1);
      else schema[i] = cleanseSchema(item);
    }
    return schema;
  }
  for (const [key, value] of Object.entries(schema)) {
    if (isEmptyValue(value)) continue;
    schema[key] = cleanseSchema(value);
  }
  return schema;
};

// STAGE 1: render DOM node template
const createNodeTemplate = (schemaInput) => {
  const templateSchema = cleanseSchema(schemaInput);
  let templateNode;

  /** @type {any} */
  let stack = [{
    schema: templateSchema,
    parentElement: null,
    indexPath: [],
  }];

  if (is.arr(templateSchema)) {
    templateNode = new DocumentFragment();
    stack = templateSchema.map((schemaItem, i) => ({
      schema: schemaItem,
      parentElement: templateNode,
      indexPath: [i],
    })).reverse();
  }

  const bindings = new Map();

  while (stack.length > 0) {
    const { schema, parentElement, indexPath } = stack.pop();

    // Collect bindings
    const binding = new Map();

    // Dynamic fragment schema
    if (is.fn(schema)) {
      const indices = indexPath.slice(0, -1);
      const startIndex = indexPath[indexPath.length - 1];
      binding.set([SCHEMA_CHILDREN, startIndex], schema);
      bindings.set(indices, binding);
      appendFragmentPlaceholder(parentElement);
      continue;
    }
    // Primitive schemas (strings, numbers, symbols)
    if (is.basic(schema)) {
      const text = document.createTextNode(schema);
      binding.set([SCHEMA_TEXT], schema);
      setElementText(text, schema);
      parentElement.append(text);
      continue;
    }

    const {
      [SCHEMA_TAG]: tag,
      [SCHEMA_TEXT]: text,
      [SCHEMA_ATTRS]: attrs,
      [SCHEMA_CLASSES]: classes,
      [SCHEMA_CHILDREN]: children,
    } = schema;

    const element = document.createElement(tag);

    if (is.fn(text)) binding.set([SCHEMA_TEXT], text);
    else setElementText(element, text);

    if (is.fn(attrs)) {
      binding.set([SCHEMA_ATTRS], attrs);
    } else if (is.obj(attrs)) {
      for (const [attr, value] of Object.entries(attrs)) {
        if (is.fn(value)) binding.set([SCHEMA_ATTRS, attr], value);
        else setElementAttr(element, attr, value);
      }
    }

    if (is.fn(classes)) binding.set([SCHEMA_CLASSES], classes);
    else if (is.str(classes)) setElementAttr(element, 'class', classes);

    if (is.fn(children)) {
      binding.set([SCHEMA_CHILDREN], children);
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

  return { templateSchema, templateNode, bindings };
};

// Skip 'children' path segment if children is obj or arr
const resolveUpdatePath = (prop, value, path) => {
  if (prop === SCHEMA_CHILDREN) {
    if (is.arr(value) || is.obj(value)) return path;
  }
  return [...path, prop];
};

// Skip deep updates if parent tag is changed
// This reduces unnecessary updates as parent is fully replaced
const shouldOptimizeUpdates = (path, results) => {
  const len = results.length;
  if (len === 0) return false;
  const lastUpdate = results[len - 1];
  const tagIndex = lastUpdate.indexOf(SCHEMA_TAG);
  if (tagIndex > -1) {
    const tagPath = lastUpdate.slice(0, tagIndex);
    if (tagPath.length === 0) return false;
    return tagPath.every((item, index) => item === path[index]);
  }
  return false;
};

// Convert diffs to update paths
const exploreUpdates = (obj, path = [], results = []) =>
  Object.entries(obj).reduce((results, [key, val]) => {
    const newPath = resolveUpdatePath(key, val, path);
    if (shouldOptimizeUpdates(newPath, results)) return results;
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
    const part = updatePath[i];
    const item = parseInt(part, 10);
    if (isNaN(item)) {
      const propPaths = updatePath.slice(i);
      // Normalize child update
      if (is.fn(part)) propPaths.unshift(SCHEMA_CHILDREN, indexPaths.pop());
      return [indexPaths, propPaths];
    }
    indexPaths.push(item);
  }
  return [indexPaths, []];
};

// Get schema diffs
const getUpdatePaths = (prevSchema, curSchema) => {
  const diffs = diff(prevSchema, curSchema, { keepFunctionsChanged: true });
  const updatePaths = exploreUpdates(diffs);
  return updatePaths.map(splitUpdatePath);
};

const getChildNodeByFragIndex = (nodes, fragmentIndex) => {
  const nodesLen = nodes.length;
  let currentIndex = -1;
  for (let i = 0; i < nodesLen; i++) {
    ++currentIndex;
    const node = nodes[i];
    if (isNode.comment(node) && node.data !== FRAG_PLACEHOLDER) {
      // Skip nodes fragment like it's single node
      if (node.data.startsWith(FRAG_RANGE_START)) {
        const { length: fragNodesLength } = parseCommentData(node.data);
        i += fragNodesLength + 1;
      }
      continue;
    }
    if (currentIndex === fragmentIndex) return node;
  }
  return null;
};

// Make element in fragment by index path
const makeBoundNode = (rootNode, schema, stateItem, indexPath) => {
  // Collect removals to prevent incorrect childNode indexing
  const removals = [];
  let node = rootNode;
  let curSchema = schema;
  for (const index of indexPath) {
    if (is.arr(curSchema)) {
      curSchema = curSchema[index];
    } else if (is.obj(curSchema) && hasOwn(curSchema, SCHEMA_CHILDREN)) {
      curSchema = curSchema[SCHEMA_CHILDREN][index];
    }

    // Seems to be redundant
    // const range = getFragmentRange(node, index);
    // if (range) {
    //   updateFragment(curSchema, node, stateItem, range);
    //   return [node, removals];
    // }

    const child = getChildNodeByFragIndex(node.childNodes, index);
    if (checkNode(child, curSchema)) {
      node = child;
    } else if (child) {
      const renderResult = render(curSchema, stateItem);
      if (isEmptyValue(renderResult)) removals.push(() => child.remove());
      else child.replaceWith(renderResult);
      return [renderResult, removals];
    } else if (isNode.element(node)) {
      const renderResult = render(curSchema, stateItem);
      node.append(renderResult);
      return [renderResult, removals];
    }
  }
  return [node, removals];
};

const applyTopNodeUpdates = (node, schema, stateItem) => {
  if (isEmptyValue(schema)) {
    node.remove();
    return true;
  }
  if (!checkNode(node, schema)) {
    const newNode = render(schema, stateItem);
    node.replaceWith(newNode);
    return true;
  }
  return is.basic(schema);
};

const applyNodeUpdates = (node, schema, updatePaths, stateItem) => {
  const removeActions = [];
  for (const path of updatePaths) {
    const [indexPath, propPath] = path;
    const [prop, nestedProp, value] = propPath;
    const [boundNode, removals] = makeBoundNode(
      node, schema, stateItem, indexPath,
    );
    if (removals.length > 0) removeActions.push(...removals);
    if (!boundNode) continue;
    const actions = makeUpdateActions(boundNode, stateItem);
    if (!hasOwn(actions, prop)) continue;
    const action = actions[prop];
    const noVal = value === undefined;
    const val = noVal ? nestedProp : value;
    const nested = noVal ? undefined : nestedProp;
    const { state, index, array } = stateItem;
    const updatedVal = is.fn(val) ? val(state, index, array) : val;
    const updateChildren = action(updatedVal, nested);
    // Replaces existing node with fragment
    if (updateChildren) updateChildren();
  }
  for (const action of removeActions) action();
};

const updateFragment = (inputSchema, parentNode, stateArray, fragRange) => {
  const children = parentNode.childNodes;
  stateArray = is.arr(stateArray) ? stateArray : [stateArray];
  const dataLength = stateArray.length;
  const schemas = is.arr(inputSchema) ? inputSchema : [inputSchema];
  const schemasLength = schemas.length;
  let { startOffset, endOffset } = fragRange;
  const fragEndNode = children[endOffset];
  let start = startOffset;
  let end = start;
  // Update nodes
  for (let i = 0; i < dataLength; ++i) {
    const stateItem = createStateItem(stateArray[i], i, stateArray);
    let schemaIndex = 0;
    start = i * schemasLength + startOffset;
    end = start + schemasLength;
    // Iterate fragment nodes
    for (let j = start; j < end; ++j) {
      let childNode = children[j];
      schemaIndex = j - start;
      // Append new nodes to fragment if schemas run out of range
      if (start + schemaIndex >= endOffset || !childNode) {
        // Append only remaining part of schemas
        const part = schemaIndex > 0 ? schemas.slice(schemaIndex) : schemas;
        const newNode = render(part, stateItem);
        if (newNode) fragEndNode.before(newNode);
        break;
      }
      let schema = schemas[schemaIndex];

      // todo provide testing for nested ranges

      // Update nested fragments
      const range = getRange(childNode);
      if (range) {
        const offset = range.endOffset - range.startOffset + 1;
        start += offset;
        startOffset += offset;
        end += offset;
        j += offset;
        updateFragment(schema, parentNode, stateItem, range);
        continue;
      }

      schema = is.fn(schema) ? schema(stateItem) : schema;

      // Apply high level replacements
      const isApplied = applyTopNodeUpdates(childNode, schema, stateItem);
      if (isApplied) continue;
      const prevSchemas = childNode[NODE_SCHEMA];
      const prevSchema = is.arr(prevSchemas)
        ? prevSchemas[schemaIndex]
        : prevSchemas;
      const updatePaths = getUpdatePaths(prevSchema, schema);
      // Apply updates
      applyNodeUpdates(childNode, schema, updatePaths, stateItem);
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

const getRange = (startComment) => {
  if (!isNode.comment(startComment)) return null;
  const { marker: start, id: startId } = parseCommentData(startComment.data);
  if (start !== FRAG_RANGE_START) return null;
  const range = new Range();
  range.setStartAfter(startComment);
  let node = startComment;
  while ((node = node.nextSibling)) {
    if (!isNode.comment(node)) continue;
    const { marker, id: endId } = parseCommentData(node.data);
    if (marker === FRAG_RANGE_END && startId === endId) {
      range.setEndBefore(node);
      return range;
    }
  }
};

// Helper to check if a node is a comment and not a placeholder
const isRangeComment = (node) =>
  isNode.comment(node) && node.data !== FRAG_PLACEHOLDER;

// Parse comment to get marker, index, and length
const parseCommentData = (comment) => {
  const [marker, index, length, id] = comment.split(':');
  return {
    marker,
    index: parseInt(index, 10),
    length: parseInt(length, 10),
    id: parseInt(id, 10),
  };
};

// todo try: instead of storing length in comment
// try to weak map start comment to end comment
// and find length (range?) between them
// length is not updated during dom ops

// Calculate node range using comment markers accounting for nesting
const getFragmentRange = (parentElement, fragmentIndex) => {
  const nodes = parentElement.childNodes;
  const nodesLength = nodes.length;
  let activeRange = null;
  let depth = 0;

  for (let i = 0; i < nodesLength; ++i) {
    const node = nodes[i];
    if (!isRangeComment(node)) continue;

    const { marker, index, length } = parseCommentData(node.data);
    if (index !== fragmentIndex) continue;

    if (marker === FRAG_RANGE_START) {
      if (depth === 0) {
        activeRange = new Range();
        activeRange.setStartAfter(node);
      }
      // Jump directly to end comment
      i += length;
      depth++;
    } else if (marker === FRAG_RANGE_END && depth > 0) {
      depth--;
      if (depth === 0 && activeRange) {
        activeRange.setEndBefore(node);
        return activeRange;
      }
    }
  }
  return null;
};

let FRAG_COUNTER = 0;

const renderFragment = (schema, index, stateArray) => {
  const fragment = new DocumentFragment();
  // First read
  const nodes = stateArray
    .map((state, index, array) => {
      const stateItem = createStateItem(state, index, array);
      return render(schema, stateItem);
    })
    .filter((node) => !isEmptyValue(node));
  // Provide data about nodes length for fragment
  const nodesLen = nodes.reduce((totalLen, node) => {
    const len = is.basic(node) ? 1 : node.childNodes.length;
    return totalLen + len;
  }, 0);
  // Mark fragment
  // todo refactor markers
  const fragId = ++FRAG_COUNTER;
  const start = new Comment(`${FRAG_RANGE_START}:${index}:${nodesLen}:${fragId}`);
  const end = new Comment(`${FRAG_RANGE_END}:${index}:${nodesLen}:${fragId}`);
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

const renderChildren = (schema, parentElement, fragmentIndex, stateArray) => {
  const tplSchema = cleanseSchema(schema);
  const range = getFragmentRange(parentElement, fragmentIndex);
  if (range) return updateFragment(tplSchema, parentElement, stateArray, range);
  const fragment = renderFragment(tplSchema, fragmentIndex, stateArray);
  return prepareFragmentInsertion(parentElement, fragment, fragmentIndex);
};

// Define schema to node update mapping
const makeUpdateActions = (parentElement, defaultStateItem) => ({
  [SCHEMA_TEXT]: (value) => setElementText(parentElement, value),
  [SCHEMA_CLASSES]: (value) => setElementAttr(parentElement, 'class', value),
  [SCHEMA_ATTRS]: (value, nestedProp) => {
    if (nestedProp) setElementAttr(parentElement, nestedProp, value);
    else setElementAttrs(parentElement, value);
  },
  [SCHEMA_CHILDREN]: (value, nestedProp) => {
    if (isEmptyValue(value)) return;
    let schema = value;
    let stateArray = [defaultStateItem.state];
    if (hasOwn(value, SCHEMA_OF_DATA)) {
      ({ [SCHEMA_COMPONENT]: schema, [SCHEMA_OF_DATA]: stateArray } = value);
    } else if (hasOwn(value, SCHEMA_ARGS_DATA)) {
      ({ [SCHEMA_COMPONENT]: schema } = value);
      stateArray = [value[SCHEMA_ARGS_DATA]];
    }
    const index = parseInt(nestedProp, 10) || 0;
    return renderChildren(schema, parentElement, index, stateArray);
  },
});

// Find element in fragment by index path
const findBoundNode = (rootElement, indexPath) => {
  let element = rootElement;
  for (const index of indexPath) {
    element = element.childNodes[index];
  }
  return element;
};

// STAGE 2: render component with bindings
const renderComponent = (rootNode, schema, bindings, stateItem) => {
  const fragmentInsertions = [];
  for (const [indexPath, binding] of bindings) {
    const parentNode = findBoundNode(rootNode, indexPath);
    const actions = makeUpdateActions(parentNode, stateItem);
    // Render bound props
    for (const [propPath, binder] of binding) {
      const [prop, nestedProp] = propPath;
      if (!hasOwn(actions, prop)) continue;
      const action = actions[prop];
      const { state, index, array } = stateItem;
      const value = binder(state, index, array);
      const insertion = action(value, nestedProp);
      if (insertion) fragmentInsertions.push(insertion);
    }
  }
  // Apply fragment insertions
  for (const insertion of fragmentInsertions) insertion();
  return rootNode;
};

const templateCache = new WeakMap();

const getTemplate = (schemaInput) => {
  let template = templateCache.get(schemaInput);
  if (template) return template;
  template = createNodeTemplate(schemaInput);
  templateCache.set(schemaInput, template);
  return template;
};

const assignNodeSchema = (node, schema) => {
  if (hasOwn(node, NODE_SCHEMA)) return;
  node[NODE_SCHEMA] = schema;
  if (isNode.fragment(node)) {
    const children = node.childNodes;
    const len = children.length;
    for (let i = 0; i < len; ++i) children[i][NODE_SCHEMA] = schema;
  }
};

const createStateItem = (state, stateIndex, stateArray) => ({
  state,
  index: stateIndex,
  array: stateArray,
});

const constructModelState = (schema, stateItem) => {
  const hasModel = hasOwn(schema, SCHEMA_MODEL);
  if (!hasModel) return stateItem;
  const args = [];
  if (stateItem) args.push(stateItem.state, stateItem.index, stateItem.array);
  const model = Reflect.construct(schema[SCHEMA_MODEL], args);
  return {
    state: model[SCHEMA_MODEL_STATE],
    index: stateItem?.index,
    array: stateItem?.array,
  };
};

export const render = (schemaInput, stateItem, rootNode) => {
  if (!is.obj(schemaInput)) return schemaInput;
  const { templateSchema, templateNode, bindings } = getTemplate(schemaInput);
  const node = rootNode || templateNode.cloneNode(true);
  const modelStateItem = constructModelState(templateSchema, stateItem);
  assignNodeSchema(node, templateSchema);
  return renderComponent(node, templateSchema, bindings, modelStateItem);
};
