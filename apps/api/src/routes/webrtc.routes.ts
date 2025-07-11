import { Router } from 'express';
import { 
    getIceServersController, 
    getAgentCredentialsController 
} from '../controllers/webrtc.controller';

const router = Router();

// Rota para obter servidores ICE do Twilio (usado pelo cliente WebRTC)
router.get('/ice-servers', getIceServersController);

// Rota para obter credenciais do agente Asterisk de forma segura
router.get('/credentials', getAgentCredentialsController);

export default router; 