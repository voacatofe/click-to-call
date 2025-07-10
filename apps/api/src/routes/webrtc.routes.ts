import { Router } from 'express';
import { getIceServersController } from '../controllers/webrtc.controller';

const router = Router();

router.get('/ice-servers', getIceServersController);

export default router; 