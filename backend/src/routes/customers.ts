import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', customerController.getAllCustomers);
router.get('/search', customerController.searchCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', requireAdmin, customerController.deleteCustomer);

export default router;
