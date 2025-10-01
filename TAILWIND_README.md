Tailwind integration notes

What I changed
- Added tailwind/postcss config files and extended package.json devDependencies.
- Updated `app/globals.css` to include Tailwind directives and CSS variables (colors, spacing, font sizes).
- Converted `app/components/Modal.js` and `app/components/HeaderBar.js` to use Tailwind utility classes and the CSS variables.

Install & run
1. Install new dev dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

Notes
- I approximated Mobills colors and scaled fonts/spacing to match their site. If you'd like exact hex values or to tune sizes, I can refine them after you review the UI.
- The project still includes `styled-components` and older components; I only converted modal/header to Tailwind as a safe first step. We can migrate the rest incrementally.
- The CSS linter may show unknown `@tailwind` / `@apply` until Tailwind is installed and PostCSS picks up the file. This is expected.
