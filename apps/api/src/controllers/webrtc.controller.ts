import { Request, Response } from 'express';
import { getIceServers, getAgentCredentials } from '../services/webrtc.service';

export const getIceServersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const iceServers = await getIceServers();
    res.status(200).json(iceServers);
  } catch (error) {
        // O erro já é logado no serviço, aqui apenas retornamos uma resposta genérica.
    res.status(500).json({ message: 'Failed to fetch ICE servers' });
  }
};

export const getAgentCredentialsController = (req: Request, res: Response): void => {
    try {
        const credentials = getAgentCredentials();
        res.status(200).json(credentials);
    } catch (error) {
        // O erro (variável de ambiente faltando) já é logado no serviço.
        res.status(500).json({ message: 'Server security configuration is incomplete.' });
    }
}; 