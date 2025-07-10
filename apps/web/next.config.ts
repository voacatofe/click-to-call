import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração padrão do Next.js
};

module.exports = {
  ...nextConfig,
  eslint: {
    // Desabilitar o cache do ESLint, que pode causar problemas
    cache: false, 
    // Corrigir opções inválidas
    // As opções 'useEslintrc' e 'extensions' foram removidas nas versões recentes
  },
  // Manter outras configurações do Next.js se existirem
};
