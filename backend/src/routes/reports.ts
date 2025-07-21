import { Router } from 'express';
import * as reportController from '../controllers/reportController';

const router = Router();

router.get('/sales', reportController.getSalesReport);
router.get('/tax', reportController.getTaxReport);

export default router;