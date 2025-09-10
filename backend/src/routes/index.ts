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
import * as jobController from '../controllers/jobController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', authenticateToken, customerRoutes);
// Jobs (project-level)
router.use('/jobs', authenticateToken, projectRoutes);
// Job Items
router.use('/job-items', authenticateToken, jobRoutes);
router.use('/shops', authenticateToken, shopRoutes);
router.use('/reports', authenticateToken, reportRoutes);
router.use('/products', authenticateToken, productRoutes);
router.use('/materials', authenticateToken, materialRoutes);
router.use('/salesmen', authenticateToken, salesmenRoutes);
router.use('/stairs', authenticateToken, stairRoutes);

// Cleanly named section and quote-item routes (not nested under /job-items)
router.put('/job-sections/:sectionId', authenticateToken, jobController.updateJobSection);
router.delete('/job-sections/:sectionId', authenticateToken, jobController.deleteJobSection);
router.put('/quote-items/:itemId', authenticateToken, jobController.updateQuoteItem);
router.delete('/quote-items/:itemId', authenticateToken, jobController.deleteQuoteItem);

export default router;
