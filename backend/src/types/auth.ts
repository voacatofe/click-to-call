import { Request } from 'express';

// Enum UserRole
export const UserRole = {
  ADMIN: 'ADMIN' as const,
  USER: 'USER' as const
};
export type UserRole = typeof UserRole[keyof typeof UserRole];

// Interface para o payload do JWT
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string;
}

// Interface para request autenticado
export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
} 