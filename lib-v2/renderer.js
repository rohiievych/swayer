import {
  DATA_ATTR_NAME,
  FRAG_PLACEHOLDER,
  FRAG_RANGE_END,
  FRAG_RANGE_START,
  NODE_SCHEMA,
} from './constants.js';
import { camelToKebabCase, equal, hasOwn, is } from './utils.js';

const setElementText = (element, text) => {
  if (is.nullish(text)) {
    text = '';
  } else if (!is.str(text)) text = text.toString();
  element.textContent = text;
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
  if (attr === 'style') {
    setElementInlineStyle(element, value);
  } else if (value === true) {
    element.setAttribute(attr, '');
  } else if (value === false) {
    element.removeAttribute(attr);
  } else if (value !== undefined) element.setAttribute(attr, value);
};

const setElementAttrs = (element, attrs) => {
  if (!is.obj(attrs)) return;
  const attrNames = element.getAttributeNames();
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

    const element = document.createElement(schema.tag);

    if (is.fn(schema.text)) {
      binding.set(['text'], schema.text);
    } else {
      setElementText(element, schema.text);
    }

    if (is.fn(schema.attrs)) {
      binding.set(['attrs'], schema.attrs);

    } else if (is.obj(schema.attrs)) {
      for (const [attr, value] of Object.entries(schema.attrs)) {
        if (is.fn(value)) binding.set(['attrs', attr], value);
      }
    }

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

    if (parentElement) {
      parentElement.append(element);
    } else {
      templateNode = element;
    }
  }

  return { templateNode, bindings };
};

// Find element in fragment by index path
const findBoundElement = (rootElement, indexPath) => {
  let element = rootElement;
  for (const index of indexPath) {
    element = element.children[index];
  }
  return element;
};

const getFragmentRange = (parentElement, index) => {
  const nodes = parentElement.childNodes;
  const nodesLength = nodes.length;
  let range;
  for (let i = 0; i < nodesLength; ++i) {
    const child = nodes[i];
    if (child.nodeType !== Node.COMMENT_NODE) continue;
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
  const nodes = is.arr(data)
    ? data.map((datum) => render(schema, datum))
    : [render(schema, data)];
  // Then write
  fragment.append(start, ...nodes, end);
  return fragment;
};

const prepareFragmentInsertion = (parentElement, fragment, index) => {
  const children = parentElement.childNodes;
  // Index is preserved using swr-placeholder comment
  const fragmentPlaceholder = children[index];
  return () => fragmentPlaceholder.replaceWith(fragment);
};

const compareNodeSchemas = (start, end, schema, children) => {
  for (let i = start; i < end; ++i) {
    const isSame = equal(schema, children[i][NODE_SCHEMA]);
    if (isSame) continue;
    return false;
  }
  return true;
};

const updateSchema = (schema, parentNode, data, fragRange) => {
  const children = parentNode.childNodes;
  const dataLength = data.length;
  const schemasLength = is.arr(schema) ? schema.length : 1;
  // const ops = [];
  const { startOffset, endOffset } = fragRange;
  const fragEndNode = children[endOffset];
  let start = startOffset;
  let end = start;

  // Start reading nodes
  for (let i = 0; i < dataLength; ++i) {
    const state = data[i];
    start = i * schemasLength + startOffset;
    end = start + schemasLength;

    // Append new nodes to fragment
    if (start >= endOffset) {
      const newNode = render(schema, state);
      fragEndNode.before(newNode);
      continue;
    }

    // Set fragment range
    const innerRange = new Range();
    innerRange.setStart(parentNode, start);

    if (end >= endOffset) {
      innerRange.setEndBefore(fragEndNode);
    } else {
      innerRange.setEnd(parentNode, end);
    }

    const areSameNodes = compareNodeSchemas(start, end, schema, children);

    // Update fragment range
    if (areSameNodes) {
      render(schema, state, innerRange.cloneContents());
    } else {
      const newNode = render(schema, state);
      innerRange.deleteContents();
      innerRange.insertNode(newNode);
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

const renderChildren = (schema, parentElement, fragmentIndex, data) => {
  const range = getFragmentRange(parentElement, fragmentIndex);
  if (range) {
    updateSchema(schema, parentElement, data, range);
    return;
  }
  const fragment = renderFragment(schema, fragmentIndex, data);
  return prepareFragmentInsertion(parentElement, fragment, fragmentIndex);
};

// STAGE 2: render component bindings
const renderComponent = (rootElement, bindings, state) => {
  /** @type {any} */
  const fragmentInsertions = [];

  for (const [indexPath, binding] of bindings) {
    const parentElement = findBoundElement(rootElement, indexPath);
    // Render bound props
    for (const [propPath, binder] of binding) {

      // Schema first level props
      if (propPath.length === 1) {
        const [prop] = propPath;

        if (prop === 'text') {
          const text = binder(state);
          setElementText(parentElement, text);

        } else if (prop === 'children') {
          const { schema, of } = binder(state);
          const insertion = renderChildren(schema, parentElement, 0, of);
          if (insertion) fragmentInsertions.push(insertion);

        } else if (prop === 'attrs') {
          const attrs = binder(state);
          setElementAttrs(parentElement, attrs);
        }
        continue;
      }
      // Schema second level props
      const [prop, indexProp] = propPath;

      if (prop === 'children') {
        const { schema, of } = binder(state);
        const insertion = renderChildren(schema, parentElement, indexProp, of);
        if (insertion) fragmentInsertions.push(insertion);

      } else if (prop === 'attrs') {
        const attrVal = binder(state);
        setElementAttr(parentElement, indexProp, attrVal);
      }
    }
  }

  // Apply fragment insertions
  for (const insertion of fragmentInsertions) insertion();

  return rootElement;
};

const COMPONENT_TEMPLATES = new WeakMap();

export const render = (schema, state, rootElement) => {
  let component = COMPONENT_TEMPLATES.get(schema);
  if (!component) {
    component = createComponent(schema);
    COMPONENT_TEMPLATES.set(schema, component);
  }
  const { templateNode, bindings } = component;
  let element = rootElement || templateNode.cloneNode(true);

  if (!hasOwn(element, 'schema')) {
    element[NODE_SCHEMA] = schema;
    if (element instanceof DocumentFragment) {
      const children = element.children;
      const len = children.length;
      for (let i = 0; i < len; ++i) children[i][NODE_SCHEMA] = schema;
    }
  }
  return renderComponent(element, bindings, state);
};
