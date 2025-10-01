Tailwind integration — feature branch proposal

Overview
--------
This folder contains a complete, safe proposal to add Tailwind CSS to the project on a feature branch. I did not modify the main branch files. Instead you'll find a PR-style diff, PostCSS + Tailwind config, a Tailwind-ready global stylesheet, and two example components converted to Tailwind.

Goals
- Integrate Tailwind (v3) in a way compatible with Next.js and Turbopack.
- Keep the migration incremental and reversible.
- Provide exact package.json changes in the patch file so you can apply them on a feature branch.

Files included
- `git-patch.diff` — unified diff you can apply with `git apply` on a new branch.
- `postcss.config.cjs` — PostCSS config for Tailwind v3.
- `tailwind.config.cjs` — Tailwind configuration.
- `app/globals.tailwind.css` — Tailwind-enabled global stylesheet. This mirrors your original `globals.css` but uses Tailwind helpers and keeps CSS variables.
- `examples/Modal.tw.js` and `examples/HeaderBar.tw.js` — example components converted to Tailwind to show how to migrate.

How to apply (recommended safe flow)
1. Create a feature branch:

```bash
git checkout -b feature/tailwind-integration
```

2. From the project root, apply the patch (this will modify package.json and add the new files):

```bash
git apply features/tailwind-integration/git-patch.diff
git add -A
git commit -m "feat: add Tailwind integration (proposal)"
```

3. Install new dependencies:

```bash
npm install --save-dev tailwindcss@^3 autoprefixer postcss
npm install
```

4. Replace `app/globals.css` with `app/globals.tailwind.css` (temporary swap) and start the dev server to smoke test:

```bash
mv app/globals.css app/globals.css.bak
cp app/globals.tailwind.css app/globals.css
npm run dev
```

5. Verify the UI, then migrate components gradually. You can revert at any time by restoring `app/globals.css.bak`.

Notes
- I chose Tailwind v3 (major version) to remain compatible with many Next.js + Turbopack setups. If you prefer a specific Tailwind patch release, update the `git-patch.diff` before applying.
- The included `examples/*.tw.js` show how to translate styled-components modal/header into Tailwind. They are living examples — migrate components one-by-one.

If you want, I can now apply the patch in this workspace (create the branch and commit). Tell me to proceed and I will create the feature branch commit here and run a dev smoke test.
