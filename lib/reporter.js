export default class Reporter {

  static #errors = {
    Default: () => 'Something went wrong.',

    BadMount: () => 'Mount element not found.',

    BadStyles: () => 'Swayer style elements not found.',

    BadSchemaInput: ({ option, input }) => {
      const options = {
        poor: 'No valid schema tag or path found. ' +
          'Consider to use valid string tag, component url or routes object',
      };
      return `${options[option]}, got ${JSON.stringify(input)}`;
    },

    BadSchema: ({ option, schema, moduleUrl }) => {
      const options = {
        invalidText: 'Invalid text, only primitive values allowed, ' +
          `got ${schema.text}.`,
        invalidChildren: 'Invalid children, only array or function ' +
          `values allowed, got ${schema.children}`,
        conflict: 'Forbidden to mix text and children fields, ' +
          `consider to use single text field or text string in children.`,
        model: 'Model is not an object.',
        state: 'Model state is not an object.',
      };
      return `${options[option]}
    in module: ${moduleUrl}
    in schema with tag: ${schema.tag}`;
    },

    ModelNotFound: (reaction) => `Cannot perform reaction ${reaction}, ` +
    `because 'model' property is not defined neither in component nor ` +
    `in the element this reaction belongs to.`,

    UnsupportedEntry: (entryFileName) => 'Cannot render arbitrary ' +
      `components yet, only '${entryFileName}' supported for now.`,

    EnvNotFound: ({ env, dir }) => 'No env file found for ' +
      `'${env}' in ${dir} directory.`,

    InvalidDirPath: (path) => `${path} is not a valid directory path.`,

    HeadNotFound: (tag) => 'No head schema found as first html child, ' +
      `got ${tag}.`,

    HtmlNotFound: (tag) => 'No html schema found as single root child,' +
      ` got ${tag}.`,

    RouteMismatch: () => 'Routed schema does not match the html ' +
      'provided by server. This critical error occurs if routing is ' +
      'broken or rendered html template is outdated.',

    RouteNotFound: ({ path, moduleUrl, tag }) => 'cannot find ' +
      `${path ? `route '${path}'` : 'any route'}
  in module: ${moduleUrl}
  in schema with tag: ${tag}`,

    RootRoutesNotFound: ({ configUrl }) => `cannot find any root route
  in module: ${configUrl}`,

    Lifecycle: ({ hook, error, schema, moduleUrl }) => `${error.message}
  in module: ${moduleUrl}
  in schema with tag: ${schema.tag}
  in hook: ${hook}`,
  };

  static #warns = {
    Default: () => 'Warning',

    MaxListenersExceeded: ({ eventName, count }) => `
  Possible EventEmitter memory leak detected.
  ${count} listeners added.
  You have to decrease the number of listeners for '${eventName}' event.
  Hint: avoid adding listeners in loops.`,

    RedundantInput: ({ input, moduleUrl }) => 'component does not accept ' +
  `input ${JSON.stringify(input)}
  in module: ${moduleUrl}`,
  };

  static error(name, context) {
    const getMessage = Reporter.#errors[name] || Reporter.#errors['Default'];
    const message = getMessage(context);
    const error = new Error(message);
    error.name = name + 'Error';
    return error;
  }

  static errorLog(name, context) {
    const getMessage = Reporter.#errors[name] || Reporter.#errors['Default'];
    const message = getMessage(context);
    console.error(`${name + 'Error'}: ${message}`);
  }

  static warn(name, context) {
    const getMessage = Reporter.#warns[name] || Reporter.#warns['Default'];
    const message = getMessage(context);
    console.warn(`${name + 'Warning'}: ${message}`);
  }
}
