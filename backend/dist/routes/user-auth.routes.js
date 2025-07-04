"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_auth_controller_1 = require("../controllers/user-auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Rotas públicas
router.post('/register', user_auth_controller_1.register);
router.post('/login', user_auth_controller_1.login);
// Rotas protegidas (requerem token JWT)
router.get('/profile', auth_middleware_1.authenticate, user_auth_controller_1.getProfile);
router.post('/rdstation-token', auth_middleware_1.authenticate, user_auth_controller_1.setRdStationToken);
exports.default = router;
