import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createCustomerApiSchema, updateCustomerApiSchema } from '../validation/schemas';

const router = Router();

router.get('/', customerController.getAllCustomers);
router.get('/search', customerController.searchCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', validateBody(createCustomerApiSchema), customerController.createCustomer);
router.put('/:id', validateBody(updateCustomerApiSchema), customerController.updateCustomer);
router.delete('/:id', requireAdmin, customerController.deleteCustomer);

export default router;
