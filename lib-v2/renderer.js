import {
  FRAG_PLACEHOLDER,
  FRAG_RANGE_END,
  FRAG_RANGE_START,
  NODE_SCHEMA,
  SCHEMA_ARGS_DATA,
  SCHEMA_ATTRS,
  SCHEMA_CHILDREN,
  SCHEMA_CLASSES,
  SCHEMA_COMPONENT,
  SCHEMA_EVENTS,
  SCHEMA_MODEL,
  SCHEMA_MODEL_STATE,
  SCHEMA_OF_DATA,
  SCHEMA_TAG,
  SCHEMA_TEXT,
} from './constants.js';
import {
  isNode,
  setElementAttr,
  setElementAttrs,
  setNodeText,
} from './node-ops.js';
import Reactivity from './reactivity.js';
import {
  createMicroTaskRunner,
  diff,
  hasOwn,
  is,
  isFalsyValue,
} from './utils.js';

// DOM implementation
const dom = window.document;

// Check if node corresponds to schema tag or text
const checkNodeSchema = (node, schema) => {
  if (!node || is.nullish(schema)) return false;
  const isTxtNode = isNode.text(node);
  if (isTxtNode && is.basic(schema)) {
    return node.textContent === schema.toString();
  }
  return node.nodeName.toLowerCase() === schema[SCHEMA_TAG];
};

// Preserves initial fragment index
const appendFragmentPlaceholder = (parentElement) => {
  const fragmentPlaceholder = dom.createComment(FRAG_PLACEHOLDER);
  parentElement.append(fragmentPlaceholder);
};

// Remove empty schema values
const cleanseSchema = (schema) => {
  if (!is.obj(schema)) return schema;
  if (is.arr(schema)) {
    const len = schema.length;
    for (let i = 0; i < len; ++i) {
      const item = schema[i];
      if (isFalsyValue(item)) schema.splice(i, 1);
      else schema[i] = cleanseSchema(item);
    }
    return schema;
  }
  for (const [key, value] of Object.entries(schema)) {
    if (isFalsyValue(value)) continue;
    schema[key] = cleanseSchema(value);
  }
  return schema;
};

// STAGE 1: render DOM node template
const createNodeTemplate = (schemaInput, modelItem) => {
  const templateSchema = cleanseSchema(schemaInput);
  let templateNode;
  /** @type {any} */
  let stack = [{
    schema: templateSchema,
    parentElement: null,
    indexPath: [],
  }];
  if (is.arr(templateSchema)) {
    templateNode = dom.createDocumentFragment();
    stack = templateSchema.map((schemaItem, i) => ({
      schema: schemaItem,
      parentElement: templateNode,
      indexPath: [i],
    })).reverse();
  }
  const bindings = new Map();
  const eventSets = new Map();
  let modelType = modelItem ? modelItem.model : null;
  while (stack.length > 0) {
    const { schema, parentElement, indexPath } = stack.pop();
    if (hasOwn(schema, SCHEMA_MODEL)) modelType = schema[SCHEMA_MODEL];
    // Collect bindings
    const binding = new Map();
    // Collect events
    const eventSet = new Set();
    // Dynamic fragment schema
    if (is.fn(schema)) {
      const indices = indexPath.slice(0, -1);
      const startIndex = indexPath[indexPath.length - 1];
      binding.set([SCHEMA_CHILDREN, startIndex], [schema, modelType]);
      bindings.set(indices, binding);
      appendFragmentPlaceholder(parentElement);
      continue;
    }
    // Primitive schemas (strings, numbers, symbols)
    if (is.basic(schema)) {
      const text = dom.createTextNode(schema);
      binding.set([SCHEMA_TEXT], [schema, modelType]);
      setNodeText(text, schema);
      parentElement.append(text);
      continue;
    }
    const {
      [SCHEMA_TAG]: tag,
      [SCHEMA_TEXT]: text,
      [SCHEMA_ATTRS]: attrs,
      [SCHEMA_EVENTS]: events,
      [SCHEMA_CLASSES]: classes,
      [SCHEMA_CHILDREN]: children,
    } = schema;
    const element = dom.createElement(tag);
    // Set template text
    if (is.fn(text)) binding.set([SCHEMA_TEXT], [text, modelType]);
    else setNodeText(element, text);
    // Set template attrs
    if (is.fn(attrs)) {
      binding.set([SCHEMA_ATTRS], [attrs, modelType]);
    } else if (is.obj(attrs)) {
      for (const [attr, value] of Object.entries(attrs)) {
        if (is.fn(value)) binding.set([SCHEMA_ATTRS, attr], [value, modelType]);
        else setElementAttr(element, attr, value);
      }
    }
    // Set events
    if (is.obj(events)) eventSet.add({ events, modelType });
    // Set template classes
    if (is.fn(classes)) binding.set([SCHEMA_CLASSES], [classes, modelType]);
    else if (is.str(classes)) setElementAttr(element, 'class', classes);
    // Prepare template children placeholders
    if (is.fn(children)) {
      binding.set([SCHEMA_CHILDREN], [children, modelType]);
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
    if (eventSet.size > 0) eventSets.set(indexPath, eventSet);
    if (parentElement) parentElement.append(element);
    else templateNode = element;
  }
  return { templateSchema, templateNode, bindings, eventSets };
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
    else if (isFalsyValue(val)) results.push(newPath);
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

const fragmentBoundaries = new WeakMap();

const getChildNodeByFragIndex = (nodes, fragmentIndex) => {
  let currentIndex = 0;
  let node = nodes[0];
  while (node) {
    // Skip nodes fragment like it's single node
    const skip = isNode.comment(node) && node.data.startsWith(FRAG_RANGE_START);
    if (skip) node = fragmentBoundaries.get(node);
    node = node.nextSibling;
    if (++currentIndex === fragmentIndex) return node;
  }
  return null;
};

// Make element in fragment by index path
const makeBoundNode = (rootNode, schema, modelItem, indexPath) => {
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
    const child = getChildNodeByFragIndex(node.childNodes, index);
    if (checkNodeSchema(child, curSchema)) {
      node = child;
    } else if (child) {
      const renderResult = render(curSchema, modelItem);
      if (isFalsyValue(renderResult)) removals.push(() => child.remove());
      else child.replaceWith(renderResult);
      return [renderResult, removals];
    } else if (isNode.element(node)) {
      const renderResult = render(curSchema, modelItem);
      node.append(renderResult);
      return [renderResult, removals];
    }
  }
  return [node, removals];
};

const applyTopNodeUpdates = (node, schema, modelItem) => {
  if (isFalsyValue(schema)) {
    node.remove();
    return true;
  }
  if (!checkNodeSchema(node, schema)) {
    const newNode = render(schema, modelItem);
    node.replaceWith(newNode);
    return true;
  }
  return is.basic(schema);
};

const applyNodeUpdates = (node, schema, updatePaths, modelItem) => {
  const removeActions = [];
  for (const path of updatePaths) {
    const [indexPath, propPath] = path;
    const [prop, nestedProp, value] = propPath;
    const [boundNode, removals] = makeBoundNode(
      node, schema, modelItem, indexPath,
    );
    if (removals.length > 0) removeActions.push(...removals);
    if (!boundNode) continue;
    const actions = makeUpdateActions(boundNode);
    if (!hasOwn(actions, prop)) continue;
    const action = actions[prop];
    const noVal = value === undefined;
    const val = noVal ? nestedProp : value;
    const nested = noVal ? undefined : nestedProp;
    const { model, index, array } = modelItem;
    const updatedVal = is.fn(val) ? val(model.state, index, array) : val;
    const updateChildren = action(updatedVal, nested, modelItem);
    // Replaces existing node with fragment
    if (updateChildren) updateChildren();
  }
  for (const action of removeActions) action();
};

const updateFragment = (inputSchema, parentNode, modelArray, fragRange) => {
  const children = parentNode.childNodes;
  modelArray = is.arr(modelArray) ? modelArray : [modelArray];
  const dataLength = modelArray.length;
  const schemas = is.arr(inputSchema) ? inputSchema : [inputSchema];
  const schemasLength = schemas.length;
  let { startOffset, endOffset } = fragRange;
  const fragEndNode = children[endOffset];
  let start = startOffset;
  let end = start;
  // Update nodes
  for (let i = 0; i < dataLength; ++i) {
    let modelItem = modelArray[i];
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
        const newNode = render(part, modelItem);
        if (newNode) fragEndNode.before(newNode);
        break;
      }
      let schema = schemas[schemaIndex];
      // Update nested fragments
      const frag = getNodeFragment(childNode);
      if (frag) {
        const range = frag.range;
        const offset = range.endOffset - range.startOffset + 1;
        start += offset;
        startOffset += offset;
        end += offset;
        j += offset;
        updateFragment(schema, parentNode, modelItem, range);
        continue;
      }
      schema = is.fn(schema) ? schema(modelItem.model.state) : schema;
      // Apply high level replacements
      const isApplied = applyTopNodeUpdates(childNode, schema, modelItem);
      if (isApplied) continue;
      const prevSchemas = childNode[NODE_SCHEMA];
      const prevSchema = is.arr(prevSchemas)
        ? prevSchemas[schemaIndex]
        : prevSchemas;
      const updatePaths = getUpdatePaths(prevSchema, schema);
      modelItem = constructModelItem(schema, modelItem);
      // Apply updates
      applyNodeUpdates(childNode, schema, updatePaths, modelItem);
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

// Parse comment to get marker, index, and length
const parseCommentData = (comment) => {
  const [marker, index] = comment.split(':');
  return {
    marker,
    index: parseInt(index, 10),
  };
};

const getNodeFragment = (startBoundary) => {
  if (!isNode.comment(startBoundary)) return null;
  const { marker, index } = parseCommentData(startBoundary.data);
  if (marker !== FRAG_RANGE_START) return null;
  const endBoundary = fragmentBoundaries.get(startBoundary);
  const range = new Range();
  range.setStartAfter(startBoundary);
  range.setEndBefore(endBoundary);
  return { range, index };
};

const getFragmentRange = (parentElement, fragmentIndex) => {
  const nodes = parentElement.childNodes;
  const nodesLength = nodes.length;
  for (let i = 0; i < nodesLength; ++i) {
    const node = nodes[i];
    const frag = getNodeFragment(node);
    if (!frag) continue;
    if (frag.index === fragmentIndex) return frag.range;
  }
  return null;
};

const renderFragment = (schema, index, modelArray) => {
  const fragment = dom.createDocumentFragment();
  // First read
  const nodes = modelArray
    .map((modelItem) => render(schema, modelItem))
    .filter((node) => !isFalsyValue(node));
  // Mark fragment
  const start = dom.createComment(`${FRAG_RANGE_START}:${index}`);
  const end = dom.createComment(`${FRAG_RANGE_END}:${index}`);
  fragmentBoundaries.set(start, end);
  // Then write
  fragment.append(start, ...nodes, end);
  return fragment;
};

const runMicroTask = createMicroTaskRunner();

const scheduleFragmentInsertion = (parentElement, fragment, index) => {
  const children = parentElement.childNodes;
  // Index is preserved using swr-frag-placeholder comment
  const fragmentPlaceholder = children[index];
  // Run as microtask to prevent premature replacement
  runMicroTask(() => fragmentPlaceholder.replaceWith(fragment));
};

const renderChildren = (schema, parentElement, fragmentIndex, modelArray) => {
  const tplSchema = cleanseSchema(schema);
  const range = getFragmentRange(parentElement, fragmentIndex);
  if (range) return updateFragment(tplSchema, parentElement, modelArray, range);
  const fragment = renderFragment(tplSchema, fragmentIndex, modelArray);
  scheduleFragmentInsertion(parentElement, fragment, fragmentIndex);
};

// Define schema to node update mapping
const makeUpdateActions = (parentElement) => ({
  [SCHEMA_TEXT]: (value) => setNodeText(parentElement, value),
  [SCHEMA_ATTRS]: (value, nestedProp) => {
    if (nestedProp) setElementAttr(parentElement, nestedProp, value);
    else setElementAttrs(parentElement, value);
  },
  [SCHEMA_CLASSES]: (value) => setElementAttr(parentElement, 'class', value),
  [SCHEMA_CHILDREN]: (value, nestedProp, defaultModelItem) => {
    if (isFalsyValue(value)) return;
    let schema = value;
    let states = [defaultModelItem.model.state];
    if (hasOwn(value, SCHEMA_OF_DATA)) {
      ({ [SCHEMA_COMPONENT]: schema, [SCHEMA_OF_DATA]: states } = value);
    } else if (hasOwn(value, SCHEMA_ARGS_DATA)) {
      ({ [SCHEMA_COMPONENT]: schema } = value);
      states = [value[SCHEMA_ARGS_DATA]];
    }
    const modelItems = states.map(
      (state, index, array) => {
        const item = createModelItem(state, index, array);
        return constructModelItem(schema, item);
      },
    );
    const index = parseInt(nestedProp, 10) || 0;
    renderChildren(schema, parentElement, index, modelItems);
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

const reactivity = new Reactivity();
const eventListeners = new WeakMap();

// STAGE 2: render component with bindings
const renderComponent = (rootNode, schema, compData) => {
  const { bindings, eventSets, modelItem } = compData;
  const modelInstances = new WeakMap();
  const getSharedModelItem = (modelType) => {
    let sharedModelItem = modelType ? modelInstances.get(modelType) : modelItem;
    if (!sharedModelItem) {
      const defaultSchema = { [SCHEMA_MODEL]: modelType };
      const item = modelItem ? createModelItem(modelItem.model.state) : null;
      sharedModelItem = constructModelItem(defaultSchema, item);
      modelInstances.set(modelType, sharedModelItem);
    }
    return sharedModelItem;
  };
  // Register bound reactions
  for (const [indexPath, binding] of bindings) {
    const parentNode = findBoundNode(rootNode, indexPath);
    const actions = makeUpdateActions(parentNode);
    // Render bound props
    for (const [propPath, binder] of binding) {
      const [prop, nestedProp] = propPath;
      if (!hasOwn(actions, prop)) continue;
      const action = actions[prop];
      const [reaction, modelType] = binder;
      const sharedModelItem = getSharedModelItem(modelType);
      // Add reactive update function
      const update = () => {
        const { model, index, array } = sharedModelItem;
        const value = reaction(model.state, index, array);
        return action(value, nestedProp, sharedModelItem);
      };
      reactivity.register(reaction, update);
    }
  }
  // Register events
  for (const [indexPath, eventSet] of eventSets) {
    const targetNode = findBoundNode(rootNode, indexPath);
    let listeners = eventListeners.get(targetNode);
    if (!listeners) eventListeners.set(listeners = new Map());
    for (const { events, modelType } of eventSet) {
      const sharedModelItem = getSharedModelItem(modelType);
      for (const [name, listener] of listeners) {
        if (hasOwn(events, name)) continue;
        targetNode.removeEventListener(name, listener);
        listeners.delete(name);
      }
      for (const [name, listener] of Object.entries(events)) {
        if (listeners.has(name)) continue;
        const boundListener = listener.bind(sharedModelItem.model);
        targetNode.addEventListener(name, boundListener);
        listeners.set(name, boundListener);
      }
      if (listeners.size === 0) eventListeners.delete(targetNode);
    }
  }
  return rootNode;
};

const templateCache = new WeakMap();

const getTemplate = (schemaInput, modelItem) => {
  let template = templateCache.get(schemaInput);
  if (template) return template;
  template = createNodeTemplate(schemaInput, modelItem);
  templateCache.set(schemaInput, template);
  return template;
};

// Attach schema to real node
const assignNodeSchema = (node, schema) => {
  if (hasOwn(node, NODE_SCHEMA)) return;
  node[NODE_SCHEMA] = schema;
  if (isNode.fragment(node)) {
    const children = node.childNodes;
    const len = children.length;
    for (let i = 0; i < len; ++i) children[i][NODE_SCHEMA] = schema;
  }
};

const createModelItem = (state, modelIndex, modelArray) => ({
  model: { state },
  index: modelIndex,
  array: modelArray,
});

const constructModelItem = (schema, modelItem) => {
  const modelCtor = schema[SCHEMA_MODEL];
  const isConstructable = is.fn(modelCtor);
  if (!isConstructable) return modelItem;
  const { model: parentModel, index, array } = modelItem || {};
  const args = parentModel ? [parentModel.state, index, array] : [];
  const model = Reflect.construct(modelCtor, args);
  if (!hasOwn(model, SCHEMA_MODEL_STATE)) throw new Error('No state in model');
  model.state = Reactivity.activate(model[SCHEMA_MODEL_STATE]);
  return { model, index, array };
};

const render = (schemaInput, modelItem, rootNode) => {
  if (!is.obj(schemaInput)) return schemaInput;
  const template = getTemplate(schemaInput, modelItem);
  const { templateSchema, templateNode, bindings, eventSets } = template;
  const compData = { bindings, eventSets, modelItem };
  const node = rootNode || templateNode.cloneNode(true);
  assignNodeSchema(node, templateSchema);
  return renderComponent(node, templateSchema, compData);
};

export const renderRoot = (schemaInput, data, rootNode) => {
  const modelItem = createModelItem(data);
  return render(schemaInput, modelItem, rootNode);
};
