import express from 'express';
import {
  // Existing functions
  getStairMaterials,
  getStairBoardTypes,
  getStairSpecialParts,
  getStairPriceRules,
  calculateStairPrice,
  createStairConfiguration,
  getStairConfiguration,
  getJobStairConfigurations,
  deleteStairConfiguration,
  // New CRUD functions
  createStairMaterial,
  updateStairMaterial,
  deleteStairMaterial,
  createBoardType,
  updateBoardType,
  deleteBoardType,
  createBoardPrice,
  updateBoardPrice,
  deleteBoardPrice,
  createSpecialPart,
  updateSpecialPart,
  deleteSpecialPart
} from '../controllers/stairController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// STAIR MATERIALS ROUTES
// ============================================
router.get('/materials', getStairMaterials);
router.post('/materials', createStairMaterial);
router.put('/materials/:id', updateStairMaterial);
router.delete('/materials/:id', deleteStairMaterial);

// ============================================
// BOARD TYPES ROUTES
// ============================================
router.get('/board-types', getStairBoardTypes);
router.post('/board-types', createBoardType);
router.put('/board-types/:id', updateBoardType);
router.delete('/board-types/:id', deleteBoardType);

// ============================================
// BOARD PRICING ROUTES
// ============================================
router.get('/price-rules', getStairPriceRules);
router.post('/price-rules', createBoardPrice);
router.put('/price-rules/:id', updateBoardPrice);
router.delete('/price-rules/:id', deleteBoardPrice);

// ============================================
// SPECIAL PARTS ROUTES
// ============================================
router.get('/special-parts', getStairSpecialParts);
router.post('/special-parts', createSpecialPart);
router.put('/special-parts/:id', updateSpecialPart);
router.delete('/special-parts/:id', deleteSpecialPart);

// ============================================
// STAIR CONFIGURATION ROUTES
// ============================================
router.get('/configurations/:id', getStairConfiguration);
router.get('/jobs/:jobId/configurations', getJobStairConfigurations);
router.post('/configurations', createStairConfiguration);
router.delete('/configurations/:id', deleteStairConfiguration);

// ============================================
// PRICING CALCULATION ROUTE
// ============================================
router.post('/calculate-price', calculateStairPrice);

export default router;