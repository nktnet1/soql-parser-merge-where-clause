import eslint from "@eslint/js";
import pluginJs from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: {
      import: importPlugin,
    },
  },
  {languageOptions: { globals: globals.node, parserOptions: { project: "./tsconfig.json"} }},
  eslint.configs.recommended,
  pluginJs.configs.recommended,
  ...tseslint.configs.strict,
  {

    rules: {
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1, maxBOF: 0 }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      indent: ["error", 2],
      "import/no-unresolved": "off",
      "import/named": "off",
      semi: ["error", "always"],
      "quote-props": ["error", "as-needed"],
      "@typescript-eslint/no-floating-promises": ["error", {}],
      quotes: [
        "error",
        "double",
        {
          avoidEscape: true,
          allowTemplateLiterals: true
        }
      ],
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "type",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
          ],
          alphabetize: {
            order: "asc",
          },
        },
      ],
    }
  }
];