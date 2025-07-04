import { Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // 1. Obter tokens do RD Station
    const tokenResponse = await axios.post('https://api.rd.services/auth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code as string,
      redirect_uri: redirectUri,
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    if (!access_token) {
      return res.status(500).send('Falha ao obter access token do RD Station.');
    }

    // 2. Obter informações do usuário do RD Station
    const userResponse = await axios.get('https://api.rd.services/platform/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { email, name } = userResponse.data;
    const providerAccountId = userResponse.data.id.toString();

    // 3. Encontrar ou criar o usuário e a conta no nosso banco de dados
    const user = await prisma.user.upsert({
      where: { email: email },
      update: { name: name },
      create: {
        email: email,
        name: name,
      },
    });

    await prisma.account.upsert({
        where: {
            provider_providerAccountId: {
                provider: 'rdstation',
                providerAccountId: providerAccountId,
            }
        },
        update: {
            access_token: access_token,
            refresh_token: refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + expires_in,
        },
        create: {
            userId: user.id,
            type: 'oauth',
            provider: 'rdstation',
            providerAccountId: providerAccountId,
            access_token: access_token,
            refresh_token: refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + expires_in,
        }
    });

    // 4. Redirecionar para o frontend com uma mensagem de sucesso
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?auth=success`);

  } catch (error) {
    console.error('Erro no callback do RD Station:', error);
    res.status(500).send('Falha na autenticação com o RD Station.');
  }
};
