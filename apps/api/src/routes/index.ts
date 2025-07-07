import { Router } from 'express';
import rdCrmRoutes from './rdcrm.routes';
import companyRoutes from './company.routes';
import callRoutes from './call.routes';

const router = Router();

router.use('/rdcrm', rdCrmRoutes);
router.use('/companies', companyRoutes);
router.use('/calls', callRoutes);

export default router; 