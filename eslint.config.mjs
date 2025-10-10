// eslint.config.mjs
import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import security from "eslint-plugin-security";
import react from "eslint-plugin-react";
import globals from "globals";

export default [
  // Ignore build artifacts and generated files
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/dist/**",
      "**/out/**",
      "**/.vercel/**",
      "**/*.hot-update.js",
      "**/.turbo/**",
      "scripts/**",
      "tests/**",
      "lib/db/seed*.mjs",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      // Make both Node and browser globals available, since Next.js runs in both
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      security,
      react,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...security.configs.recommended.rules,
      "no-console": "warn",
      "security/detect-object-injection": "off",
      // Treat JSX usage as a reference to avoid false unused-var errors
      "react/jsx-uses-vars": "error",
      "react/react-in-jsx-scope": "off",
    },
  },
];
