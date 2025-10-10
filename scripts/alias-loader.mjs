// Experimental ESM loader to support @/* path alias when running Node directly
import path from 'path';
import fs from 'fs';
import { pathToFileURL, fileURLToPath } from 'url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveAlias(spec) {
  if (!spec.startsWith('@/')) return null;
  const rel = spec.slice(2); // drop '@/'
  const base = path.join(projectRoot, rel);
  const candidates = [base, base + '.js', base + '.mjs', base + '.cjs', path.join(base, 'index.js')];
  for (const c of candidates) {
    try { const st = fs.statSync(c); if (st.isFile()) return pathToFileURL(c).href; } catch { /* ignore */ }
  }
  return pathToFileURL(base).href; // fallback
}

export async function resolve(specifier, context, defaultResolve) {
  // Handle @/ aliases
  const aliasUrl = resolveAlias(specifier);
  if (aliasUrl) return { url: aliasUrl, shortCircuit: true };

  // Shim next/server to a local minimal impl for handler smoke tests
  if (specifier === 'next/server') {
    const shim = path.join(projectRoot, 'scripts', 'shims', 'next-server.mjs');
    return { url: pathToFileURL(shim).href, shortCircuit: true };
  }
  if (specifier === 'next-auth' || specifier === 'next-auth/next') {
    const shim = path.join(projectRoot, 'scripts', 'shims', 'next-auth.mjs');
    return { url: pathToFileURL(shim).href, shortCircuit: true };
  }

  // Handle extensionless relative paths (./, ../)
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const base = path.resolve(parentDir, specifier);
    const candidates = [base, base + '.js', base + '.mjs', base + '.cjs', path.join(base, 'index.js')];
    for (const c of candidates) {
      try { const st = fs.statSync(c); if (st.isFile()) return { url: pathToFileURL(c).href, shortCircuit: true }; } catch { /* ignore */ }
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  return defaultLoad(url, context, defaultLoad);
}
