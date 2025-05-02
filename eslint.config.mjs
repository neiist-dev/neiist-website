import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Existing compat config
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Custom config for validate-filename
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
            {
              case: "camel",
              target: "**/providers/**",
              patterns: "^[a-zA-Z]*Provider",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
