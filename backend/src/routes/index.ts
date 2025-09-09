import { Router } from 'express';
import authRoutes from './auth';
import customerRoutes from './customers';
import jobRoutes from './jobs';
import projectRoutes from './projects';
import shopRoutes from './shops';
import reportRoutes from './reports';
import productRoutes from './products';
import materialRoutes from './materials';
import salesmenRoutes from './salesmen';
import stairRoutes from './stairs';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', authenticateToken, customerRoutes);
router.use('/jobs', authenticateToken, jobRoutes);
router.use('/projects', authenticateToken, projectRoutes);
router.use('/shops', authenticateToken, shopRoutes);
router.use('/reports', authenticateToken, reportRoutes);
router.use('/products', authenticateToken, productRoutes);
router.use('/materials', authenticateToken, materialRoutes);
router.use('/salesmen', authenticateToken, salesmenRoutes);
router.use('/stairs', authenticateToken, stairRoutes);

export default router;