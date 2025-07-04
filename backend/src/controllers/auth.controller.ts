import { Request, Response } from 'express';
import axios from 'axios';

export const redirectToRDStation = (req: Request, res: Response) => {
  const clientId = process.env.RD_STATION_CLIENT_ID;
  const redirectUri = `${process.env.BACKEND_URL}/auth/rdstation/callback`;
  
  if (!clientId) {
    return res.status(500).send('Client ID do RD Station não configurado.');
  }

  const authUrl = `https://api.rd.services/auth/dialog?client_id=${clientId}&redirect_uri=${redirectUri}`;
  
  res.redirect(authUrl);
};

export const handleRDStationCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Código de autorização não encontrado.');
  }

  try {
    const clientId = process.env.RD_STATION_CLIENT_ID;
    const clientSecret = process.env.RD_STATION_CLIENT_SECRET;
    const redirectUri = `${process.env.BACKEND_URL}/auth/rdstation/callback`;

    if (!clientId || !clientSecret) {
      return res.status(500).send('Credenciais do RD Station não configuradas.');
    }

    const response = await axios.post('https://api.rd.services/auth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code as string,
      redirect_uri: redirectUri,
    });

    const { access_token, refresh_token } = response.data;

    // Próximo passo: Armazenar os tokens de forma segura (subtarefa 2.3)
    // Por enquanto, vamos apenas enviá-los de volta para o frontend para teste

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?access_token=${access_token}&refresh_token=${refresh_token}`);

  } catch (error) {
    console.error('Erro ao obter token do RD Station:', error);
    res.status(500).send('Falha ao obter token de acesso.');
  }
};
