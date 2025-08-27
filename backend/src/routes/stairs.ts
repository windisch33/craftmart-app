import express from 'express';
// Import from specific controller files
import {
  getStairMaterials,
  createStairMaterial,
  updateStairMaterial,
  deleteStairMaterial
} from '../controllers/stairMaterialController';
import {
  getStairBoardTypes,
  createBoardType,
  updateBoardType,
  deleteBoardType
} from '../controllers/stairBoardTypeController';
import {
  getStairPriceRules,
  calculateStairPrice,
  createBoardPrice,
  updateBoardPrice,
  deleteBoardPrice
} from '../controllers/stairPricingController';
import {
  getStairSpecialParts,
  createSpecialPart,
  updateSpecialPart,
  deleteSpecialPart
} from '../controllers/stairSpecialPartController';
import {
  createStairConfiguration,
  getStairConfiguration,
  getJobStairConfigurations,
  deleteStairConfiguration
} from '../controllers/stairConfigurationController';
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