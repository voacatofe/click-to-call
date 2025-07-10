/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração padrão do Next.js
};

export default {
  ...nextConfig,
  eslint: {
    // Desabilitar o cache do ESLint, que pode causar problemas
    cache: false, 
    // Corrigir opções inválidas (useEslintrc e extensions)
  },
}; 