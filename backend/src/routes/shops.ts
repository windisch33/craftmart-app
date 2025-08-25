import { Router } from 'express';
import * as shopController from '../controllers/shopController';

const router = Router();

// New shop generation routes
router.get('/available-orders', shopController.getAvailableOrders);
router.post('/generate', shopController.generateShops);
router.put('/:id/status', shopController.updateShopStatus);

// PDF download routes
router.get('/:id/shop-paper', shopController.downloadShopPaper);
router.get('/:id/cut-list', shopController.downloadCutList);

// Existing CRUD routes
router.get('/', shopController.getAllShops);
router.get('/:id', shopController.getShopById);
router.post('/', shopController.createShop);
router.put('/:id', shopController.updateShop);
router.delete('/:id', shopController.deleteShop);

export default router;