import { Request } from 'express';
export declare const UserRole: {
    ADMIN: "ADMIN";
    USER: "USER";
};
export type UserRole = typeof UserRole[keyof typeof UserRole];
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    companyId: string;
}
export interface AuthenticatedRequest extends Request {
    user: JWTPayload;
}
