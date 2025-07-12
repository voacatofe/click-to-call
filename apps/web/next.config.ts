/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desabilitando o modo estrito do React para evitar a dupla renderização em desenvolvimento,
  // que pode causar problemas com conexões WebSocket e UA do JsSIP.
  reactStrictMode: false,
  
  // Configuração do ESLint alinhada com as novas versões do Next.js
  eslint: {
    // Ignorar durante o build, pois o linting já é feito em outras etapas do CI/CD
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
