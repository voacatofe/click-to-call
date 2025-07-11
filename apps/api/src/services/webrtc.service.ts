import twilio from 'twilio';

// Função para validar variáveis de ambiente críticas
const getRequiredEnv = (varName: string): string => {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
  return value;
};

// --- Funções para ICE Servers (Twilio) ---

export const getIceServers = async () => {
  const accountSid = getRequiredEnv('TWILIO_ACCOUNT_SID');
  const authToken = getRequiredEnv('TWILIO_AUTH_TOKEN');
  const client = twilio(accountSid, authToken);

  try {
    const token = await client.tokens.create({ ttl: 3600 }); // Token válido por 1 hora
    return token.iceServers;
  } catch (error) {
    console.error('Error fetching ICE servers from Twilio:', error);
    throw new Error('Failed to fetch ICE servers.');
  }
};

// --- Funções para Credenciais do Agente (Asterisk) ---

export const getAgentCredentials = () => {
  const agentId = 'agent-1001-wss'; // Ramal fixo por enquanto
  const password = getRequiredEnv('AGENT_1001_PASSWORD');
  
  // No futuro, isso pode ser expandido para buscar credenciais dinâmicas do banco de dados
  // com base no usuário autenticado.

  return { agentId, password };
}; 