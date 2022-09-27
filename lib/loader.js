export default class Loader {
  static MAIN_FILE_NAME = 'main.js';
  config;
  #moduleCache = {};
  #namespaces;
  #origin;

  async loadConfig(rootUrl) {
    const configUrl = `${rootUrl}/${Loader.MAIN_FILE_NAME}`;
    this.config = (await import(configUrl)).default;
    this.#namespaces = this.config.namespaces;
    this.#origin = rootUrl;
    return this.config;
  }

  async loadSchema({ path, args }) {
    const { moduleUrl, defaultExport } = await this.#loadModule(path);
    const isFactory = typeof defaultExport === 'function';
    const input = isFactory ? defaultExport(args) : defaultExport;
    return { input, moduleUrl };
  }

  resolveNamespace(path, makeAbsolute = false) {
    if (!this.#namespaces) return path;
    const firstSlashPos = path.indexOf('/');
    const ns = path.slice(0, firstSlashPos);
    const prefix = this.#namespaces[ns];
    if (prefix) path = prefix + path.slice(firstSlashPos);
    if (makeAbsolute) path = this.#createAbsoluteUrl(path);
    return path;
  }

  async #loadModule(path) {
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

  #createAbsoluteUrl(relativePath) {
    return new URL(relativePath, this.#origin).toString();
  }
}