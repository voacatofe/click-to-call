"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_auth_controller_1 = require("../controllers/user-auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Wrapper para funções async normais
const asyncHandler = (fn) => {
    return (req, res, next) => {
        void fn(req, res, next).catch(next);
    };
};
// Wrapper para funções async autenticadas
const authAsyncHandler = (fn) => {
    return (req, res, next) => {
        void fn(req, res, next).catch(next);
    };
};
// Rotas públicas
router.post('/register', asyncHandler(user_auth_controller_1.register));
router.post('/login', asyncHandler(user_auth_controller_1.login));
// Rotas protegidas (requerem token JWT)
router.get('/profile', auth_middleware_1.authenticate, authAsyncHandler(user_auth_controller_1.getProfile));
router.post('/rdstation-token', auth_middleware_1.authenticate, authAsyncHandler(user_auth_controller_1.setRdStationToken));
exports.default = router;
//# sourceMappingURL=user-auth.routes.js.map