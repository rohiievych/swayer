import Reporter from './reporter.js';
import { hasOwn, is } from './utils.js';

export default class Loader {
  #moduleCache = {};
  #namespaces = {};
  #engine;

  constructor(engine) {
    this.#engine = engine;
  }

  setNamespaces(namespaces) {
    Object.assign(this.#namespaces, namespaces);
  }

  async loadSchemaModule(schemaRef) {
    const { path, input } = schemaRef;
    const { moduleUrl, defaultExport } = await this.loadModule(path);
    const isFactory = is.fn(defaultExport);
    if (!isFactory && hasOwn(schemaRef, 'input')) {
      Reporter.warn('RedundantInput', { input, moduleUrl });
    }
    const schema = isFactory ? await defaultExport(input) : defaultExport;
    return { schema, url: moduleUrl };
  }

  async loadModule(path) {
    const cache = this.#moduleCache;
    const url = path.endsWith('.js') ? path : `${path}.js`;
    const cached = cache[url];
    if (cached) return cached;
    let moduleUrl;
    if (url.startsWith('http')) moduleUrl = url;
    else moduleUrl = this.resolveNamespace(url, true);
    const defaultExport = (await import(moduleUrl)).default;
    return (cache[url] = { defaultExport, moduleUrl });
  }

  resolveNamespace(path, makeAbsolute = false) {
    const firstSlashPos = path.indexOf('/');
    const ns = path.slice(0, firstSlashPos);
    const prefix = this.#namespaces[ns];
    let resolvedPath = path;
    if (prefix) resolvedPath = prefix + path.slice(firstSlashPos);
    if (makeAbsolute) resolvedPath = this.#createAbsoluteUrl(resolvedPath);
    return resolvedPath;
  }

  #createAbsoluteUrl(relativePath) {
    const base = this.#engine.options.entryModulePath;
    return new URL(relativePath, base).toString();
  }
}
