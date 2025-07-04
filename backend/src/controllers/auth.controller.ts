import { Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Para RD Station CRM, vamos usar uma abordagem mais simples
// O usuário fornece seu token do CRM diretamente
export const authenticateWithToken = async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ 
      error: 'Token do RD Station CRM é obrigatório.',
      message: 'Forneça seu token de usuário do RD Station CRM'
    });
  }

  try {
    // Testar o token fazendo uma requisição para listar usuários
    // Isso nos dará informações do usuário autenticado
    const userResponse = await axios.get('https://crm.rdstation.com/api/v1/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // A API do CRM retorna uma lista de usuários da conta
    // Vamos assumir que o primeiro usuário é o usuário autenticado
    // (Em uma implementação mais robusta, poderíamos ter um endpoint específico)
    const userData = userResponse.data.users[0];
    
    if (!userData) {
      return res.status(401).json({ 
        error: 'Token inválido ou sem permissões.',
        message: 'Verifique se o token está correto e tem as permissões necessárias'
      });
    }

    const { email, name, id } = userData;
    const providerAccountId = id.toString();

    // Criar ou atualizar usuário no nosso banco
    const user = await prisma.user.upsert({
      where: { email: email },
      update: { name: name },
      create: {
        email: email,
        name: name,
      },
    });

    // Armazenar o token do CRM
    await prisma.account.upsert({
        where: {
            provider_providerAccountId: {
                provider: 'rdstation-crm',
                providerAccountId: providerAccountId,
            }
        },
        update: {
            access_token: token,
            // Para tokens do CRM, não há refresh_token ou expiração
        },
        create: {
            userId: user.id,
            type: 'token',
            provider: 'rdstation-crm',
            providerAccountId: providerAccountId,
            access_token: token,
        }
    });

    res.json({ 
      success: true, 
      message: 'Autenticação realizada com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('Erro na autenticação com RD Station CRM:', error);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Token inválido.',
        message: 'Verifique se o token do RD Station CRM está correto'
      });
    }
    
    res.status(500).json({ 
      error: 'Falha na autenticação com o RD Station CRM.',
      message: 'Erro interno do servidor'
    });
  }
};

// Função para obter informações do usuário autenticado
export const getUserInfo = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          where: { provider: 'rdstation-crm' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const account = user.accounts[0];
    if (!account) {
      return res.status(404).json({ error: 'Conta do RD Station CRM não encontrada' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      hasValidToken: !!account.access_token
    });

  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para testar se o token ainda é válido
export const validateToken = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          where: { provider: 'rdstation-crm' }
        }
      }
    });

    if (!user || !user.accounts[0]) {
      return res.status(404).json({ error: 'Usuário ou token não encontrado' });
    }

    const token = user.accounts[0].access_token;
    
    // Testar o token fazendo uma requisição simples
    await axios.get('https://crm.rdstation.com/api/v1/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ valid: true, message: 'Token válido' });

  } catch (error: any) {
    if (error.response?.status === 401) {
      res.status(401).json({ valid: false, message: 'Token inválido ou expirado' });
    } else {
      res.status(500).json({ error: 'Erro ao validar token' });
    }
  }
};
