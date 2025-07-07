import { Router } from 'express';
import { 
  listCompaniesController, 
  getCompanyByIdController, 
  createCompanyController, 
  updateCompanyController,
  deleteCompanyController
} from '../controllers/company.controller';

const router = Router();

router.get('/', listCompaniesController);
router.post('/', createCompanyController);
router.get('/:id', getCompanyByIdController);
router.patch('/:id', updateCompanyController);
router.delete('/:id', deleteCompanyController);

export default router; 