import twilio from 'twilio';

// Função para validar variáveis de ambiente críticas
const getRequiredEnv = (varName: string): string => {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
  return value;
};

const accountSid = getRequiredEnv('TWILIO_ACCOUNT_SID');
const authToken = getRequiredEnv('TWILIO_AUTH_TOKEN');

const client = twilio(accountSid, authToken);

export const getIceServers = async () => {
  try {
    const token = await client.tokens.create({ ttl: 3600 }); // Token válido por 1 hora
    return token.iceServers;
  } catch (error) {
    console.error('Error fetching ICE servers from Twilio:', error);
    throw new Error('Failed to fetch ICE servers.');
  }
}; 