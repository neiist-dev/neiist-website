import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
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
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript", "prettier"],
  }),
  {
    plugins: {
      "validate-filename": await import("eslint-plugin-validate-filename"),
    },
    rules: {
      "validate-filename/naming-rules": [
        "error",
        {
          rules: [
            {
              case: "pascal",
              target: "**/components/**",
            },
            {
              case: "camel",
              target: "**/app/api/**",
            },
            {
              case: "kebab",
              target: "**/app/**",
              patterns: "^(page|layout|loading|error|not-found|route|template).tsx$",
            },
            {
              case: "camel",
              target: "**/hooks/**",
              patterns: "^use",
            },
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
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-irregular-whitespace": "error",
    },
  },
];

export default eslintConfig;
