import { Router } from 'express';
import {
  listDeposits,
  getDepositById,
  createDeposit,
  allocateDeposit,
  removeAllocation,
  getCustomerJobs,
  getJobItems
} from '../controllers/depositController';

const router = Router();

router.get('/', listDeposits);
router.get('/customers/:customerId/jobs', getCustomerJobs);
router.get('/jobs/:jobId/items', getJobItems);
router.get('/:id', getDepositById);
router.post('/', createDeposit);
router.post('/:id/allocate', allocateDeposit);
router.delete('/allocations/:allocationId', removeAllocation);

export default router;
