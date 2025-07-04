import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    ignores: ["frontend/**/*", "node_modules/**/*"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      // Adicione regras personalizadas aqui conforme necessário
      "no-unused-vars": "warn",
      "no-console": "warn"
    }
  }
];
