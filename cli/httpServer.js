import { createReadStream } from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { ENTRY_FILE_NAME } from '../lib/constants.js';
import ServerPlatform from '../lib/platforms/server.js';
import Reporter from '../lib/reporter.js';

const FILE_TYPES = {
  html: 'text/html; charset=UTF-8',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
  map: 'application/json',
  ico: 'image/x-icon',
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpg',
  svg: 'image/svg+xml',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
};

const UNSAFE_PATH = /^(\.\.[/\\])+/;

const getType = (filePath) => {
  const typeName = extname(filePath).slice(1);
  return FILE_TYPES[typeName];
};

const getDate = () => new Date().toISOString();

const resolveSrc = () => fsp.access('src')
  .then(() => 'src')
  .catch(() => './');

export default class HttpServer {
  #platform;

  constructor() {
    this.#platform = new ServerPlatform();
  }

  async start(options) {
    const { path } = options;
    const rootPath = resolve(path || './');
    const baseStats = await fsp.lstat(rootPath);
    if (!baseStats.isDirectory()) {
      throw Reporter.error('InvalidDirPath', rootPath);
    }
    const srcPath = resolve(path || await resolveSrc());
    const server = http.createServer(async (req, res) => {
      const routePath = String(req.url);
      try {
        res.statusCode = 200;
        if (routePath.includes('.')) {
          const safeSuffix = normalize(routePath).replace(UNSAFE_PATH, '');
          const fromModules = routePath.startsWith('/node_modules');
          const staticPath = fromModules ? rootPath : srcPath;
          const filePath = join(staticPath, safeSuffix);
          await fsp.access(filePath);
          const type = getType(filePath);
          res.setHeader('Content-Type', type);
          createReadStream(filePath).pipe(res);
        } else {
          const { basePath = '/', enginePath, input, mode } = options;
          const entryPath = join(srcPath, basePath, ENTRY_FILE_NAME);
          const renderOptions = {
            entryPath, routePath,
            basePath, enginePath,
            input, mode,
          };
          const content = await this.#platform.render(renderOptions);
          res.setHeader('Content-Type', FILE_TYPES.html);
          res.end(content);
        }
      } catch (error) {
        console.log(error);
        res.statusCode = 404;
        res.end();
      }
    });
    const { host = '127.0.0.1', port = 8000 } = options;
    server.listen(port, host, () => {
      console.log(`${getDate()} Server running at http://${host}:${port}/`);
    });
  }
}
