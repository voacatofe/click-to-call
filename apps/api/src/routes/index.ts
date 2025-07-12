import { Router } from 'express';
import callRoutes from './call.routes';
import companyRoutes from './company.routes';
import rdcrmRoutes from './rdcrm.routes';
import webrtcRoutes from './webrtc.routes';

const router = Router();

// Health check endpoint for Docker
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'click-to-call-api',
    version: '1.0.0'
  });
});

// API Routes
router.use('/rdcrm', rdcrmRoutes);
router.use('/call', callRoutes);
router.use('/company', companyRoutes);
router.use('/webrtc', webrtcRoutes);

export default router; 