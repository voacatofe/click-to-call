import { Request, Response } from 'express';

// Esta função retorna as credenciais do agente a partir das variáveis de ambiente.
// Em um sistema real, isso poderia vir de um banco de dados ou de um serviço de segredos.
export const getWebRTCCredentials = (req: Request, res: Response) => {
  const agentId = process.env.AGENT_1001_ID || 'agent-1001';
  const agentPassword = process.env.AGENT_1001_PASSWORD;

  if (!agentPassword) {
    return res.status(500).json({ error: 'A senha do agente não está configurada no servidor.' });
  }

  res.json({
    agentId,
    password: agentPassword,
    realm: process.env.ASTERISK_REALM || 'clicktocall.local'
  });
}; 