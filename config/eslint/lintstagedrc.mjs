import path from "path";

/**
 * @param {string[]} filenames
 * @returns {string}
 */
const buildEslintCommand = (filenames) =>
  `eslint -c ./config/eslint/eslint.config.mjs --fix ${filenames
    .map(
      /**
       * @param {string} f
       */
      (f) => path.relative(process.cwd(), f)
    )
    .join(" ")}`;

const prettierCmd =
  "prettier --config ./config/prettier/.prettierrc.json --ignore-path ./config/prettier/.prettierignore --write";

/** @type {Record<string, (string | ((files: string[]) => string))[]>} */
const config = {
  "*.{js,jsx,ts,tsx}": [buildEslintCommand],
  "*.{js,jsx,ts,tsx,json,css,md}": [prettierCmd],
};

export default config;
