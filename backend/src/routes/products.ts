import { Router } from 'express';
import * as productController from '../controllers/productController';

const router = Router();

// Products routes
router.get('/', productController.getAllProducts);

// Handrail-specific routes
router.post('/handrails', productController.createHandrailProduct);
router.put('/handrails/:id', productController.updateHandrailProduct);

// Landing tread-specific routes
router.get('/landing-treads', productController.getLandingTreadProducts);
router.post('/landing-treads', productController.createLandingTreadProduct);
router.put('/landing-treads/:id', productController.updateLandingTreadProduct);

// Rail parts-specific routes
router.get('/rail-parts', productController.getRailPartsProducts);
router.post('/rail-parts', productController.createRailPartsProduct);
router.put('/rail-parts/:id', productController.updateRailPartsProduct);

// Generic product routes (must be after specific routes to avoid conflicts)
router.get('/:id', productController.getProductById);
router.delete('/:id', productController.deleteProduct);

export default router;