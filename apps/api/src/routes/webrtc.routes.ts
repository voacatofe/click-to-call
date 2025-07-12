import { Router } from 'express';
import { getWebRTCCredentials } from '../controllers/webrtc.controller';
import { getIceServers } from '../services/webrtc.service';

const router = Router();

// Rota para obter credenciais do agente (ID, senha, realm)
router.get('/credentials', getWebRTCCredentials);

// Rota para obter servidores ICE (STUN/TURN)
router.get('/ice-servers', async (req, res) => {
    try {
        const iceServers = await getIceServers();
        res.json(iceServers);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao obter servidores ICE.' });
    }
});

export default router; 