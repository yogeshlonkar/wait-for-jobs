import parser from "@typescript-eslint/parser"
import tsEslint from "@typescript-eslint/eslint-plugin"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"

// TODO: add eslint-plugin-import after v9 support

export default [
  eslintPluginPrettierRecommended,
  {
    ignores: ["dist/", "bin/", "node_modules/"],
    languageOptions: {
      globals: { node: true },
      parser,
    },
    files: ['src/**/*.ts'],
    plugins: {
      "@typescript-eslint": tsEslint,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // "import/first": "error",
      // "import/newline-after-import": "error",
      // "import/no-duplicates": "error",
      "simple-import-sort/imports": "error",
      "sort-imports": "off",
      "max-len": ["error", { "code": 120, "ignoreComments": true, "ignoreStrings": true}]
    }
  }
]
