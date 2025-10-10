// Enable @/* alias resolution for Node ESM test scripts
import { pathToFileURL } from 'url';
import Module from 'module';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const aliasPrefix = '@/';
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith(aliasPrefix)) {
    const rel = request.slice(aliasPrefix.length);
    request = path.join(projectRoot, rel);
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

export default null;
