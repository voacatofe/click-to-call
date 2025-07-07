import { Router } from 'express';
import { listContactsController, updateRdTokenController } from '../controllers/rdcrm.controller';
import { injectRdTokenMiddleware } from '../middlewares/injectRdToken.middleware';

const router = Router();

// Rota pública para atualizar o token, não precisa de injeção
router.post('/token/:companyId', updateRdTokenController);

// Aplica o middleware a todas as rotas ABAIXO desta linha
router.use(injectRdTokenMiddleware);

router.get('/contacts', listContactsController);

export default router; 