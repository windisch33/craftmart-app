import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { validateBody, validateParams, idParamSchema } from '../middleware/validation';
import { createProjectApiSchema, updateProjectApiSchema } from '../validation/schemas';

const router = Router();

router.get('/', projectController.getAllProjects);
router.get('/:id', validateParams(idParamSchema), projectController.getProjectById);
router.post('/', validateBody(createProjectApiSchema), projectController.createProject);
router.put('/:id', validateParams(idParamSchema), validateBody(updateProjectApiSchema), projectController.updateProject);
router.delete('/:id', validateParams(idParamSchema), projectController.deleteProject);

export default router;
