import { Router } from 'express';
import { listCallsController, createCallController, startCallController } from '../controllers/call.controller';

const router = Router();

router.get('/', listCallsController);
router.post('/', createCallController);
router.post('/start', startCallController);

export default router; 