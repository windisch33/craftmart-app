import { Router } from 'express';
import * as productController from '../controllers/productController';

const router = Router();

// Products routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/handrails', productController.createHandrailProduct);
router.put('/handrails/:id', productController.updateHandrailProduct);
router.delete('/:id', productController.deleteProduct);

export default router;