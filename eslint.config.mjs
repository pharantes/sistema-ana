// eslint.config.mjs
import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import security from "eslint-plugin-security";

export default [
  js.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
      security,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...security.configs.recommended.rules,
      "no-console": "warn",
      "security/detect-object-injection": "off",
    },
  },
];
