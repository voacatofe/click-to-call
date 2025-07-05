"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        res.status(401).json({
            error: 'Token não fornecido',
            message: 'Token de autenticação é obrigatório'
        });
        return;
    }
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            // Token secret não configurado
            res.status(500).json({
                error: 'Erro de configuração do servidor',
                message: 'JWT secret não configurado'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({
            error: 'Token inválido',
            message: 'Token de autenticação inválido'
        });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map