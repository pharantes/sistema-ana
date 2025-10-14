Design tokens and migration notes

This file documents the CSS variables (tokens) used across the app/ folder, rationale for their values, and a short list of intentional exceptions where fixed px values are preserved for layout-critical reasons.

Tokens (declared in `app/globals.css`)

- --space-xxs: 4px
- --space-xs: 8px
- --space-sm: 12px
- --space-md: 16px
- --space-lg: 24px
- --space-xl: 32px

- --gap-xs: 6px
- --gap-sm: 12px
- --gap-md: 16px

- --control-height: 36px
- --small-input-width: (used, default 120/180/260 in components via fallback)
- --modal-min-width: 420px
- --page-padding, --page-gap: top-level layout tokens (keep cautiously)

- --radius-sm: 6px
- --radius-md: 10px
- --radius-pill: 999px (pills/badges)

- --font-size-sm, --font-size-base, --font-h1/h2/h3: typographic scale

- --skeleton-height, --loading-dot-size, --loading-jump: small helpers used by primitives

Rationale

- Keep a 36px control baseline for interactive elements (buttons, selects) to match desktop ergonomics and align with existing components like BRDateInput/BRCurrencyInput.
- Prefer semantic gap tokens (`--gap-*`) for grid/flex gaps and `--space-*` for paddings/margins.
- Use tokens with safe fallbacks in existing components (e.g., var(--control-height, 36px)) to minimize regressions during incremental migration.

Intentional exceptions (do not auto-convert)

- Table column `max-width` values used to avoid column collapse on smaller screens. Examples:
  - `app/colaboradores/Client.js` — many `th:nth-child(N)` max-widths (e.g., 280px, 220px, 180px)
  - `app/colaboradores/Client.js` — `min-width: var(--search-min-width, 260px)` kept as a token fallback but desktop values are preserved
- Modal minimum widths and CTA-specific paddings used to keep modal layouts reasonable: `--modal-min-width: 420px` (kept)
- Page-level wide layout tokens like `--page-padding` and `--page-gap` are intentionally large by default; migrate cautiously.

Checklist for future bursts

- Replace raw px under 24px (4/6/8/12/16/24) with tokens and fallbacks.
- Preserve values that drive layout behavior (max-width, minmax, modal min-width, specific table column widths).
- Run tests after each burst and fix compile/import issues immediately.
- Add an ESLint rule or a vitest that flags inline `NNpx` usage in `app/` files to avoid regressions.

Notes

- A number of components were already updated to use tokens and shared primitives. Where components still have explicit px values, they are mostly layout-critical and listed above.
- If you want, I can add the ESLint rule next and/or proceed with another low-risk batch focusing on files not yet tokenized.
