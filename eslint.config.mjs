import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignorar arquivos que não precisam ser lintados
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
      "**/*.md",
      "**/docs/**",
      "**/README.md",
      "**/CHANGELOG.md",
      "**/.env*",
      "**/docker-compose*.yml",
      "**/Dockerfile*",
      "**/recordings/**",
      "**/sounds/**",
      "**/certs/**",
      "**/keys/**",
      "**/.git/**",
      "**/.vscode/**",
      "**/.cursor/**",
      "**/pnpm-lock.yaml",
      "**/package-lock.json",
      "**/turbo.json",
      "**/tsconfig.json"
    ]
  },
  // Configuração base para arquivos TypeScript/JavaScript
  ...compat.extends("@eslint/js/recommended"),
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        global: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "prefer-const": "warn"
    }
  }
];

export default eslintConfig; 