/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desabilitando o modo estrito do React para evitar a dupla renderização em desenvolvimento,
  // que pode causar problemas com conexões WebSocket e UA do JsSIP.
  reactStrictMode: false,
  
  // Otimização de build para reduzir o tempo de compilação
  swcMinify: true,

  // Configuração do ESLint alinhada com as novas versões do Next.js
  eslint: {
    // A opção 'cache' foi movida para fora do eslint a partir do Next.js 13
    // A opção 'useEslintrc' foi descontinuada
    // 'extensions' agora é gerenciado internamente pelo Next.js
    
    // Ignorar durante o build, pois o linting já é feito em outras etapas do CI/CD
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
