import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "coverage", "node_modules"]),

  // Application source: browser globals.
  {
    files: ["src/**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: { react },
    settings: { react: { version: "detect" } },
    rules: {
      // Without this, a component referenced only inside JSX (e.g. a
      // destructured `icon: Icon`) is reported as unused.
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "off",
      "no-unused-vars": [
        "error",
        { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },

  // Tests additionally get the Vitest globals.
  {
    files: ["src/**/*.{test,spec}.{js,jsx}", "src/test/**/*.{js,jsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  /*
   * Root-level tooling runs in Node, not the browser. Without this block
   * `vite.config.js` failed `no-undef` on `__dirname`, which is what made the
   * frontend lint job red on a clean checkout.
   */
  {
    files: ["*.{js,mjs,cjs}", "vite.config.js", "vitest.config.js"],
    extends: [js.configs.recommended, prettier],
    languageOptions: {
      globals: globals.node,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
  },
]);
