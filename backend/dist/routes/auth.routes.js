"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// Rota para autenticar com token do RD Station CRM
router.post('/rdstation-crm/authenticate', auth_controller_1.authenticateWithToken);
// Rota para obter informações do usuário
router.get('/user/:userId', auth_controller_1.getUserInfo);
// Rota para validar se o token ainda é válido
router.get('/user/:userId/validate-token', auth_controller_1.validateToken);
exports.default = router;
