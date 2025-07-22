import { Router } from 'express';
import authRoutes from './auth';
import customerRoutes from './customers';
import jobRoutes from './jobs';
import shopRoutes from './shops';
import reportRoutes from './reports';
import productRoutes from './products';
import materialRoutes from './materials';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', authenticateToken, customerRoutes);
router.use('/jobs', authenticateToken, jobRoutes);
router.use('/shops', authenticateToken, shopRoutes);
router.use('/reports', authenticateToken, reportRoutes);
router.use('/products', authenticateToken, productRoutes);
router.use('/materials', authenticateToken, materialRoutes);

export default router;