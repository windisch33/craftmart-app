import { Router } from 'express';
import * as shopController from '../controllers/shopController';

const router = Router();

router.get('/', shopController.getAllShops);
router.get('/:id', shopController.getShopById);
router.post('/', shopController.createShop);
router.put('/:id', shopController.updateShop);
router.delete('/:id', shopController.deleteShop);

export default router;