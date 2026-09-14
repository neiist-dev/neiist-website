import baseConfig from "../../config/eslint/eslint.config.mjs";

export default [
  ...baseConfig,
  {
    // Standalone UI library has no Next.js runtime dependency
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
