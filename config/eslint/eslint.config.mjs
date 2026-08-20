import { defineConfig, globalIgnores } from "eslint/config";
import eslintJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintReact from "@eslint-react/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import validateFilename from "eslint-plugin-validate-filename";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "dist/**",
    "build/**",
    "out/**",
    "public/**",
    "docker/**",
    ".husky/**",
    "next-env.d.ts",
    "yarn.lock",
    "pnpm-lock.lock",
    "pnpm-workspace.lock",
    "**/*.md",
    "**/*.yml",
    "**/*.yaml",
    "./scripts/**",
    "./packages/**",
  ]),

  {
    files: ["**/*.{js,jsx,ts,tsx}"],

    extends: [
      eslintJs.configs.recommended,
      tseslint.configs.recommended,
      eslintReact.configs["recommended-typescript"],
    ],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module",
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      "@next/next": nextPlugin,
      "validate-filename": validateFilename,
    },

    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...(nextPlugin.configs["core-web-vitals"]?.rules ?? {}),

      // Filename rules
      "validate-filename/naming-rules": [
        "error",
        {
          rules: [
            { case: "pascal", target: "**/components/**" },
            { case: "camel", target: "**/app/api/**" },
            {
              case: "kebab",
              target: "**/app/**",
              patterns: "^(page|layout|loading|error|not-found|route|template|sitemap)\\.(tsx|ts)$",
            },
            { case: "camel", target: "**/hooks/**", patterns: "^use" },
          ],
        },
      ],

      "max-len": [
        "error",
        {
          code: 100,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true,
          ignoreTrailingComments: true,
          ignorePattern: "^\\s*// eslint-disable-next-line|^\\s*[A-Za-zÀ-ÿ\\s.,!?()\\-–—]+\\s*$",
        },
      ],

      "no-console": ["error", { allow: ["error", "warn"] }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-irregular-whitespace": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      /*
      "react/forbid-elements": [
        "error",
        {
          forbid: [
            { element: "button", message: "Use the shared `Button` primitive instead." },
            { element: "input", message: "Use the shared `Input` primitive instead." },
            { element: "a", message: "Use `next/link` for internal navigation." },
          ],
        },
      ],
      */

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["lucide-react"], message: "Use our project default library `react-icons`." },
          ],
        },
      ],

      "@eslint-react/set-state-in-effect": "off",
    },
  },

  {
    files: ["**/app/**/page.tsx", "**/app/**/layout.tsx"],
    rules: {
      "@eslint-react/purity": "off",
    },
  },

  {
    files: ["**/presenters/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["useState", "useEffect", "useContext", "useReducer"],
              message: "Presenters must be dumb. Do not use React state/effects here.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Move fetch to an orchestrator." },
        { name: "localStorage", message: "Move storage to an orchestrator." },
      ],
    },
  },

  eslintConfigPrettier,
]);
