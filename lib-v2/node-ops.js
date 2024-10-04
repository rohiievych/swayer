import { DATA_ATTR_NAME } from './constants.js';
import { camelToKebabCase, hasOwn, is, isFalsyValue } from './utils.js';

const isNode = {
  text: (node) => node.nodeType === Node.TEXT_NODE,
  element: (node) => node.nodeType === Node.ELEMENT_NODE,
  comment: (node) => node.nodeType === Node.COMMENT_NODE,
  fragment: (node) => node.nodeType === Node.DOCUMENT_FRAGMENT_NODE,
};

const setNodeText = (node, text) => {
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
  else if (isFalsyValue(value)) element.removeAttribute(attr);
  else element.setAttribute(attr, value);
};

const setElementAttrs = (element, attrs) => {
  const attrNames = element.getAttributeNames();
  if (isFalsyValue(attrs)) {
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

export {
  isNode,
  setNodeText,
  setElementAttr,
  setElementAttrs,
};
