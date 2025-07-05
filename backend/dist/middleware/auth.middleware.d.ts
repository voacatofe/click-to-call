import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth';
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
