"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_auth_routes_1 = __importDefault(require("./routes/user-auth.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
// Rotas
app.use('/auth', auth_routes_1.default);
app.use('/auth', user_auth_routes_1.default);
// Rota de teste
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor rodando!' });
});
// Iniciar servidor
app.listen(Number(PORT), '0.0.0.0', () => {
    // Servidor iniciado com sucesso
    process.stdout.write(`Servidor rodando na porta ${PORT}\n`);
});
//# sourceMappingURL=index.js.map