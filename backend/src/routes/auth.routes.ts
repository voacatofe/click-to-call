import { Router } from 'express';
import { redirectToRDStation, handleRDStationCallback } from '../controllers/auth.controller';

const router = Router();

router.get('/rdstation', redirectToRDStation);
router.get('/rdstation/callback', handleRDStationCallback);

export default router;
