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
import { validateBody } from '../middleware/validation';
import { calculateStairPriceSchema, createStairConfigurationApiSchema } from '../validation/schemas';

const router = express.Router();

// Auth is enforced at the parent router (/stairs)

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
// Legacy board pricing mutation routes removed in favor of simplified pricing table

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
router.post('/configurations', validateBody(createStairConfigurationApiSchema), createStairConfiguration);
router.delete('/configurations/:id', deleteStairConfiguration);

// ============================================
// PRICING CALCULATION ROUTE
// ============================================
router.post('/calculate-price', validateBody(calculateStairPriceSchema), calculateStairPrice);

export default router;
