import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    // skip Next build output and other generated folders
    if (full.includes(`${path.sep}.next${path.sep}`) || full.includes(`${path.sep}node_modules${path.sep}`)) continue;
    let st;
    try {
      st = fs.statSync(full);
    } catch (err) {
      // ignore unreadable files (Windows EPERM on .next/trace etc.)
      continue;
    }
    if (st.isDirectory()) files.push(...walk(full));
    else if (/\.(js|jsx|ts|tsx|css|mjs|cjs)$/.test(full)) files.push(full);
  }
  return files;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('no inline px tokens', () => {
  it('flags files containing raw px literals (e.g. 12px) outside of var(...) fallbacks', () => {
    const root = path.resolve(process.cwd());
    const files = walk(root)
      .filter(f => !f.includes('node_modules'))
      .filter(f => !f.includes(`${path.sep}.git${path.sep}`))
      .filter(f => !f.includes(`${path.sep}.next${path.sep}`))
      .filter(f => !f.includes(`${path.sep}tests${path.sep}`))
      .filter(f => !f.includes(`${path.sep}public${path.sep}`));

    const hits = [];
    const allowFileRegex = /(?:^|[\\/])(?:app[\\/]globals\.css|scripts|public)(?:$|[\\/])/i;
    const allowLineRegex = /(outline:\s*\d+px|width:\s*-?\d+px|margin:\s*-?\d+px|max-height:|min-width:|if\s*\(l\.includes\(|box-shadow|border(?:-|:)|@media\s*\(max-width|flex:\s*\d+\s+\d+\s+\d+px|--[\w-]+:\s*\d+px)/i;
    const re = /(?<!var\([^)]*)\b(\d{1,3}px)\b/gi; // naive: px not directly inside var(...)

    // lines that are acceptable to contain px values (layout-critical or token defs)
    const allowPattern = /\b(min-width|min-width:|max-width|max-width:|grid-template-columns|minmax\(|repeat\(|box-shadow|border(?:-bottom|-top|-left|-right)?\b|flex:\s*\d+\s+\d+\s+\d+px|@media\s*\(max-width|--[\w-]+:\s*\d+px)\b/i;

    for (const f of files) {
      const txt = fs.readFileSync(f, 'utf8');
      const clean = stripComments(txt);
      // ignore tokenized fallback like var(--space-xxs, 8px)
      const lines = clean.split(/\r?\n/);
      // skip entire file if it's an allowed file (globals, scripts)
      if (allowFileRegex.test(path.relative(root, f))) continue;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (re.test(line)) {
          // ignore occurrences inside var(..., 8px)
          if (/var\([^)]+\d{1,3}px\)/.test(line)) continue;
          // ignore layout-critical patterns and token definitions
          if (allowPattern.test(line)) continue;
          // ignore some common small rules that legitimately use px
          if (allowLineRegex.test(line)) continue;
          hits.push(`${path.relative(root, f)}:${i + 1}:${line.trim()}`);
        }
      }
    }

    expect(hits).toEqual([]);
  });
});
