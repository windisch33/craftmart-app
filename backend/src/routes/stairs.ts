import express from 'express';
import {
  getStairMaterials,
  getStairBoardTypes,
  getStairSpecialParts,
  getStairPriceRules,
  calculateStairPrice,
  createStairConfiguration,
  getStairConfiguration,
  getJobStairConfigurations,
  deleteStairConfiguration
} from '../controllers/stairController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/materials', getStairMaterials);
router.get('/board-types', getStairBoardTypes);
router.get('/special-parts', getStairSpecialParts);
router.get('/price-rules', getStairPriceRules);
router.get('/configurations/:id', getStairConfiguration);
router.get('/jobs/:jobId/configurations', getJobStairConfigurations);

// POST routes
router.post('/calculate-price', calculateStairPrice);
router.post('/configurations', createStairConfiguration);

// DELETE routes
router.delete('/configurations/:id', deleteStairConfiguration);

export default router;