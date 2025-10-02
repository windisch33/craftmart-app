import { Router } from 'express';
import * as productController from '../controllers/productController';
import { validateBody, validateParams, validateQuery, idParamSchema } from '../middleware/validation';
import {
  getProductsQuerySchema,
  createHandrailProductSchema,
  updateHandrailProductSchema,
  createLandingTreadProductSchema,
  updateLandingTreadProductSchema,
  createRailPartsProductSchema,
  updateRailPartsProductSchema
} from '../validation/schemas';

const router = Router();

// Products routes
router.get('/', validateQuery(getProductsQuerySchema), productController.getAllProducts);

// Handrail-specific routes
router.post('/handrails', validateBody(createHandrailProductSchema), productController.createHandrailProduct);
router.put('/handrails/:id', validateParams(idParamSchema), validateBody(updateHandrailProductSchema), productController.updateHandrailProduct);

// Landing tread-specific routes
router.get('/landing-treads', productController.getLandingTreadProducts);
router.post('/landing-treads', validateBody(createLandingTreadProductSchema), productController.createLandingTreadProduct);
router.put('/landing-treads/:id', validateParams(idParamSchema), validateBody(updateLandingTreadProductSchema), productController.updateLandingTreadProduct);

// Rail parts-specific routes
router.get('/rail-parts', productController.getRailPartsProducts);
router.post('/rail-parts', validateBody(createRailPartsProductSchema), productController.createRailPartsProduct);
router.put('/rail-parts/:id', validateParams(idParamSchema), validateBody(updateRailPartsProductSchema), productController.updateRailPartsProduct);

// Generic product routes (must be after specific routes to avoid conflicts)
router.get('/:id', validateParams(idParamSchema), productController.getProductById);
router.delete('/:id', validateParams(idParamSchema), productController.deleteProduct);

export default router;
