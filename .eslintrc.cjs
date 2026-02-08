/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    // "@vue/typescript/recommended",
    "@vue/eslint-config-typescript/recommended",
    // "@vue/eslint-config-prettier",
  ],
  overrides: [
    {
      files: ["cypress/e2e/**.{cy,spec}.{js,ts,jsx,tsx}"],
      extends: ["plugin:cypress/recommended"],
    },
    {
      files: ["*.config.js"],
      env: {
        node: true,
      },
    },
  ],
  rules: {
    "linebreak-style": "off",
    // "comma-dangle": ["error", "always-multiline"]
  },
};
