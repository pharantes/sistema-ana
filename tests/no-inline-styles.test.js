import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    // skip Next build output and node_modules
    if (full.includes(`${path.sep}.next${path.sep}`) || full.includes(`${path.sep}node_modules${path.sep}`)) continue;
    let st;
    try {
      st = fs.statSync(full);
    } catch (err) {
      continue;
    }
    if (st.isDirectory()) files.push(...walk(full));
    else if (/\.(js|jsx|ts|tsx)$/.test(full)) files.push(full);
  }
  return files;
}

function stripComments(src) {
  // remove block and line comments (simple regex)
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('no inline style props', () => {
  it('no files contain style={ (excluding build and tests folders)', () => {
    const root = path.resolve(process.cwd());
    const files = walk(root)
      .filter(f => !f.includes('node_modules'))
      .filter(f => !f.includes(`${path.sep}.git${path.sep}`))
      .filter(f => !f.includes(`${path.sep}.next${path.sep}`))
      .filter(f => !f.includes(`${path.sep}tests${path.sep}`));
    const hits = [];
    for (const f of files) {
      const txt = fs.readFileSync(f, 'utf8');
      const clean = stripComments(txt);
      if (clean.includes('style={')) hits.push(f.replace(root + path.sep, ''));
    }
    expect(hits).toEqual([]);
  });
});
