import { exec as execute } from 'node:child_process';
import fsp from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import prettifyHTML from 'pretty';
import { minify } from 'terser';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { ENTRY_FILE_NAME, ENV_FILE_NAME } from '../lib/constants.js';
import ServerPlatform from '../lib/platforms/server.js';
import Reporter from '../lib/reporter.js';

const exec = promisify(execute);

const ensureDirAccess = async (dirPath) => {
  try {
    await fsp.access(dirPath);
  } catch {
    await fsp.mkdir(dirPath, { recursive: true });
  }
};

const SPA_INDEX = 'index.html';

const OUTPUT_DIR = 'dist';

const ENV_DIR = 'environments';

const PACKAGE_FILES = [
  'package.json',
  'package-lock.json',
];

const BUILD_FILES = [
  'app',
  'assets',
  ENTRY_FILE_NAME,
  ...PACKAGE_FILES,
];

const TERSER_OPTIONS = {
  module: true,
  format: {
    // eslint-disable-next-line camelcase
    quote_style: 3,
  },
};

export default class Builder {
  #platform;

  constructor(platformOptions = {}) {
    this.#platform = new ServerPlatform(platformOptions);
  }

  async build(options) {
    const { path = './', output, env, production: isProd } = options;
    const srcDir = resolve(path);
    const outputDir = output ? resolve(output) : resolve(path, OUTPUT_DIR);
    const buildFiles = BUILD_FILES.map((path) => join(srcDir, path));
    const filter = (src) => buildFiles.some((name) => src.startsWith(name));
    await this.#copyDir(srcDir, outputDir, { filter, isProd });
    await this.#copyEnv(srcDir, outputDir, env);
    await this.#runCommand('npm ci --omit=dev', outputDir);
    await this.#cleanFilesFromDir(PACKAGE_FILES, outputDir);
  }

  async render(options) {
    const { path, input, output, route, pretty } = options;
    const outputPath = output ? output : path.replace('.js', '.html');
    const fullOutputPath = resolve(outputPath);
    let content = await this.#platform.render(path, input, route);
    if (pretty) content = prettifyHTML(content);
    await fsp.writeFile(fullOutputPath, content);
  }

  async createSPAPage(options) {
    const { path = './', title, lang  } = options;
    const fullOutputPath = resolve(path, SPA_INDEX);
    const content = this.#platform.createSPA(title, lang);
    await fsp.writeFile(fullOutputPath, content);
  }

  async createStarter(name) {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const templateDir = join(currentDir, 'templates', 'starterApp');
    const destDir = resolve(name);
    await fsp.cp(templateDir, destDir, { recursive: true });
    await this.#runCommand('npm i', destDir);
  }

  async #copyEnv(srcDir, destDir, env = 'development') {
    const envDirPath = join(srcDir, ENV_DIR);
    try {
      await fsp.access(envDirPath);
    } catch {
      return;
    }
    const dirents = await fsp.readdir(envDirPath);
    const envFile = dirents.find((name) => {
      const middleExt = extname(basename(name, '.js')).slice(1);
      return middleExt === env;
    });
    if (!envFile) throw Reporter.error('EnvNotFound', { env, dir: envDirPath });
    const srcPath = join(envDirPath, envFile);
    const destPath = join(destDir, ENV_FILE_NAME);
    await fsp.copyFile(srcPath, destPath);
  }

  async #runCommand(command, cwd) {
    const { stdout } = await exec(command, { cwd });
    console.log(stdout);
  }

  async #cleanFilesFromDir(files, dir) {
    const removals = files.map((path) => {
      const file = join(dir, path);
      return fsp.rm(file);
    });
    await Promise.all(removals);
  }

  async #copyDir(srcDir, destDir, options = {}) {
    const { filter = () => true, isProd = false } = options;
    await ensureDirAccess(destDir);
    for await (const srcFile of this.#iterateFiles(srcDir)) {
      if (filter(srcFile)) {
        const destFile = srcFile.replace(srcDir, destDir);
        await ensureDirAccess(dirname(destFile));
        const minify = srcFile.endsWith('.js') && isProd;
        if (minify) await this.#writeMinified(srcFile, destFile);
        else await fsp.copyFile(srcFile, destFile);
      }
    }
  }

  async #writeMinified(srcFile, destFile) {
    const source = await fsp.readFile(srcFile, 'utf-8');
    const { code = '' } = await minify(source, TERSER_OPTIONS);
    return fsp.writeFile(destFile, code);
  }

  async *#iterateFiles(dirPath) {
    const dirents = await fsp.readdir(dirPath, { withFileTypes: true });
    for (const dirent of dirents) {
      const file = resolve(dirPath, dirent.name);
      if (dirent.isDirectory()) yield* this.#iterateFiles(file);
      else yield file;
    }
  }
}
