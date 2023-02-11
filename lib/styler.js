import { CLASS_PREFIX } from './constants.js';
import SchemaHasher from './hasher.js';
import { camelToKebabCase, is } from './utils.js';

const PSEUDO_CLASSES = [
  ['first', 'first-of-type'],
  ['last', 'last-of-type'],
  ['hover', 'hover'],
  ['focus', 'focus'],
  ['checked', 'checked'],
  ['active', 'active'],
  ['disabled', 'disabled'],
  ['link', 'link'],
  ['visited', 'visited'],
];

const PSEUDO_ELEMENTS = [
  ['before', 'before'],
  ['after', 'after'],
  ['placeholder', 'placeholder'],
];

const PSEUDO_FUNCTIONS = [
  ['nth', 'nth-of-type'],
  ['not', 'not'],
];

const SYNTHETIC_FEATURES = [
  'animations',
  'compute',
];

const collectSyntheticProps = () => {
  const map = PSEUDO_CLASSES.concat(PSEUDO_ELEMENTS).concat(PSEUDO_FUNCTIONS);
  return Object.keys(Object.fromEntries(map)).concat(SYNTHETIC_FEATURES);
};

export default class Styler {
  static #syntheticProps = collectSyntheticProps();
  #classes;
  #handleRule;

  constructor(ruleHandler, classes = []) {
    this.#handleRule = ruleHandler;
    this.#classes = new Set(classes);
  }

  changeStyles(context, prevStyles, curStyles) {
    if (!Styler.#hasAnyStyles(curStyles)) return;
    const className = this.#makeClass(curStyles);
    const prevHash = SchemaHasher.hashStyles(prevStyles);
    const prevClassName = CLASS_PREFIX + prevHash;
    context.binding.toggleClass(prevClassName, false);
    context.binding.toggleClass(className, true);
  }

  setStyles(context, styles) {
    if (!Styler.#hasAnyStyles(styles)) return;
    const className = this.#makeClass(styles);
    context.binding.toggleClass(className, true);
  }

  setRuleHandler(handler) {
    this.#classes.clear();
    this.#handleRule = handler;
  }

  #makeClass(styles) {
    const hash = SchemaHasher.hashStyles(styles);
    const className = CLASS_PREFIX + hash;
    const isClassRegistered = this.#classes.has(className);
    if (isClassRegistered) return className;
    const selector = `.${className}`;
    this.#createPseudo(selector, styles);
    this.#createAnimations(selector, styles);
    this.#createStyleRule(selector, styles);
    this.#classes.add(className);
    return className;
  }

  #createPseudo(selector, styles) {
    this.#createPseudoSelectors(selector, styles, ':');
    this.#createPseudoSelectors(selector, styles, '::');
    this.#createPseudoFunctions(selector, styles);
  }

  #createPseudoSelectors(selector, styles, delimiter) {
    const syntaxMap = delimiter === ':' ? PSEUDO_CLASSES : PSEUDO_ELEMENTS;
    for (const [prop, pseudo] of syntaxMap) {
      const pseudoStyles = styles[prop];
      if (pseudoStyles) {
        const rule = Styler.#createRule(pseudoStyles);
        const pseudoSelector = selector + delimiter + pseudo;
        if (rule) this.#addRule(pseudoSelector, rule);
        this.#createPseudo(pseudoSelector, pseudoStyles);
      }
    }
  }

  #createPseudoFunctions(selector, styles) {
    for (const [prop, pseudoClass] of PSEUDO_FUNCTIONS) {
      const pseudoStyles = styles[prop];
      if (pseudoStyles) {
        const { arg, rule: ruleConfig } = pseudoStyles;
        const pseudoSelector = `${selector}:${pseudoClass}(${arg})`;
        const rule = Styler.#createRule(ruleConfig);
        if (rule) this.#addRule(pseudoSelector, rule);
        this.#createPseudo(pseudoSelector, pseudoStyles);
      }
    }
  }

  #createAnimations(selector, styles) {
    const animations = styles.animations;
    if (!is.arr(animations)) return;
    for (const animation of animations) {
      const { name, keyframes } = animation;
      if (!keyframes) continue;
      let keyframesRule = '';
      for (const key in keyframes) {
        const rule = Styler.#createRule(keyframes[key]);
        keyframesRule += `${key} { ${rule} }`;
      }
      this.#addRule(`@keyframes ${name}`, keyframesRule);
    }
  }

  #createStyleRule(selector, styles) {
    const rule = Styler.#createRule(styles);
    this.#addRule(selector, rule);
  }

  #addRule(statement, rule) {
    this.#handleRule(`${statement} { ${rule} }`);
  }

  static #createRule(styles) {
    return Object.entries(styles).reduce((rule, [prop, value]) => {
      if (Styler.#syntheticProps.includes(prop)) return rule;
      const style = camelToKebabCase(prop);
      return (rule += `${style}: ${value};`);
    }, '');
  }

  static #hasAnyStyles(styles) {
    if (!is.obj(styles)) return false;
    const keys = Object.keys(styles);
    if (keys.length === 0) return false;
    return keys.length > 1 || keys[0] !== 'compute';
  }
}
