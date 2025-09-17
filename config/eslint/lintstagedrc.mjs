import path from "path";

const buildEslintCommand = (filenames) =>
  `eslint -c ./config/eslint/eslint.config.mjs --fix ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" ")}`;

const prettierCmd =
  "prettier --config ./config/prettier/.prettierrc.json --ignore-path ./config/prettier/.prettierignore --write";

const config = {
  "*.{js,jsx,ts,tsx}": [buildEslintCommand],
  "*.{js,jsx,ts,tsx,json,css,md}": [prettierCmd],
};

export default config;
