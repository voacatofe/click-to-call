import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Prisma } from '@prisma/client';
import axios from 'axios'; // Adicionar import do axios aqui

const prisma = new PrismaClient();

// Enum UserRole
const UserRole = {
  ADMIN: 'ADMIN' as const,
  USER: 'USER' as const
};
type UserRole = typeof UserRole[keyof typeof UserRole];

// Interface para o payload do JWT
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string;
}

// Função auxiliar para gerar JWT
const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }
  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRATION_TIME || '1h' } as jwt.SignOptions);
};

// Registrar nova empresa e usuário administrador
export const register = async (req: Request, res: Response) => {
  const { companyName, name, email, password } = req.body;

  // Validações básicas
  if (!companyName || !name || !email || !password) {
    return res.status(400).json({
      error: 'Dados obrigatórios',
      message: 'Nome da empresa, nome, email e senha são obrigatórios'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Senha muito fraca',
      message: 'A senha deve ter pelo menos 6 caracteres'
    });
  }

  try {
    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email já cadastrado',
        message: 'Este email já está sendo usado por outro usuário'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar empresa e usuário em uma transação
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Criar a empresa
      const company = await tx.company.create({
        data: {
          name: companyName
        }
      });

      // Criar o usuário administrador
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          companyId: company.id
        }
      });

      return { company, user };
    });

    // Gerar token JWT
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role as UserRole,
      companyId: result.company.id
    });

    res.status(201).json({
      success: true,
      message: 'Empresa e usuário criados com sucesso',
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      },
      company: {
        id: result.company.id,
        name: result.company.name
      }
    });

  } catch {
    // Error logged internally (replace with proper logging service in production)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Falha ao criar empresa e usuário'
    });
  }
};

// Login de usuário
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Dados obrigatórios',
      message: 'Email e senha são obrigatórios'
    });
  }

  try {
    // Buscar usuário com informações da empresa
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Gerar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      companyId: user.companyId
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      company: {
        id: user.company.id,
        name: user.company.name,
        hasRdStationToken: !!user.company.rdStationCrmToken
      }
    });

    } catch {
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Falha na autenticação'
    });
  }
};

// Configurar token do RD Station CRM (apenas para ADMINs)
export const setRdStationToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  const user = (req as any).user; // Vem do middleware de autenticação

  if (!token) {
    return res.status(400).json({
      error: 'Token obrigatório',
      message: 'Token do RD Station CRM é obrigatório'
    });
  }

  // Verificar se o usuário é ADMIN
  if (user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Apenas administradores podem configurar o token do RD Station'
    });
  }

  try {
    // Testar o token com a API do RD Station
    await axios.get(`https://crm.rdstation.com/api/v1/users?token=${token}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Se chegou até aqui, o token é válido
    // Salvar o token na empresa
    await prisma.company.update({
      where: { id: user.companyId },
      data: { rdStationCrmToken: token }
    });

    res.json({
      success: true,
      message: 'Token do RD Station CRM configurado com sucesso'
    });

  } catch (error: any) {

    
    if (error.response?.status === 401) {
      return res.status(400).json({
        error: 'Token inválido',
        message: 'O token do RD Station CRM fornecido é inválido'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Falha ao configurar token'
    });
  }
};

// Obter informações do usuário autenticado
export const getProfile = async (req: Request, res: Response) => {
  const user = (req as any).user; // Vem do middleware de autenticação

  try {
    const userWithCompany = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        company: true
      }
    });

    if (!userWithCompany) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      user: {
        id: userWithCompany.id,
        name: userWithCompany.name,
        email: userWithCompany.email,
        role: userWithCompany.role
      },
      company: {
        id: userWithCompany.company.id,
        name: userWithCompany.company.name,
        hasRdStationToken: !!userWithCompany.company.rdStationCrmToken
      }
    });

    } catch {
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
}; 