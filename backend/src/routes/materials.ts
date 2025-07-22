import { Router } from 'express';
import * as materialController from '../controllers/materialController';

const router = Router();

// Materials routes
router.get('/', materialController.getAllMaterials);
router.get('/:id', materialController.getMaterialById);
router.post('/', materialController.createMaterial);
router.put('/:id', materialController.updateMaterial);
router.delete('/:id', materialController.deleteMaterial);

export default router;