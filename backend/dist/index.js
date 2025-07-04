"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_auth_routes_1 = __importDefault(require("./routes/user-auth.routes")); // Importar as novas rotas
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});
app.use('/api/auth', user_auth_routes_1.default); // Usar as novas rotas de usuário/empresa
app.use('/api/integration', auth_routes_1.default); // Manter as rotas de integração (legado/futuro)
app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
});
