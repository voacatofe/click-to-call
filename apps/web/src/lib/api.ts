
// Arquivo: apps/web/src/lib/api.ts

export const getApiUrl = (path: string): string => {
  // Garante que o path comece com uma barra
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Verifica se estamos rodando em localhost (desenvolvimento)
  // Esta verificação funciona tanto no navegador quanto no servidor (SSR)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return `http://localhost:3001${formattedPath}`;
  }
  
  // Em produção ou outros ambientes (EasyPanel), usa caminho relativo
  // O EasyPanel faz o roteamento interno entre frontend e backend
  return formattedPath;
}; 