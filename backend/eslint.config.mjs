import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    ignores: ["frontend/**/*", "node_modules/**/*", "dist/**/*", "eslint.config.mjs"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // Adicione regras personalizadas aqui conforme necessário
      "no-unused-vars": "warn",
      "no-console": "warn",
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
);
