import { Router } from 'express';
import * as salesmanController from '../controllers/salesmanController';

const router = Router();

// Get all salesmen (with optional active filter)
router.get('/', salesmanController.getAllSalesmen);

// Search salesmen
router.get('/search', salesmanController.searchSalesmen);

// Get specific salesman by ID
router.get('/:id', salesmanController.getSalesmanById);

// Get salesman statistics
router.get('/:id/stats', salesmanController.getSalesmanStats);

// Create new salesman
router.post('/', salesmanController.createSalesman);

// Update salesman
router.put('/:id', salesmanController.updateSalesman);

// Delete salesman
router.delete('/:id', salesmanController.deleteSalesman);

export default router;