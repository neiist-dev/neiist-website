import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import validateFilename from "eslint-plugin-validate-filename";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * Normalize Next.js config rule names from "@next/next/..." to "next/..."
 * Accepts undefined safely.
 *
 * @param {Record<string, any> | undefined} rules
 * @returns {Record<string, any>}
 */
function normalizeNextRules(rules) {
  /** @type {Record<string, any>} */
  const normalized = {};
  if (!rules) return normalized;
  for (const [key, value] of Object.entries(rules)) {
    if (key.startsWith("@next/next/")) {
      normalized["next/" + key.replace("@next/next/", "")] = value;
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

export default [
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      "**/public/**",
      "**/docker/**",
      "**/.husky/**",
      "**/yarn.lock",
      "**/*.md",
      "**/*.yml",
      "**/*.yaml",
    ],
  },

  {
    files: ["**/*.{js,jsx,ts,tsx}"],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
      },
    },

    plugins: {
      "@typescript-eslint": tsPlugin,
      next: nextPlugin,
      "validate-filename": validateFilename,
      "react-hooks": reactHooks,
    },

    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": ["warn", { additionalHooks: "" }],
      ...normalizeNextRules(nextPlugin.configs?.["core-web-vitals"]?.rules ?? {}),
      ...(tsPlugin.configs?.recommended?.rules ?? {}),
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
              patterns: "^(page|layout|loading|error|not-found|route|template).tsx$",
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
    },
  },
];
