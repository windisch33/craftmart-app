import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { validateBody, validateParams, validateQuery, idParamSchema } from '../middleware/validation';
import { createProjectApiSchema, updateProjectApiSchema, getProjectsQuerySchema } from '../validation/schemas';

const router = Router();

router.get('/', validateQuery(getProjectsQuerySchema), projectController.getAllProjects);
router.get('/:id', validateParams(idParamSchema), projectController.getProjectById);
router.post('/', validateBody(createProjectApiSchema), projectController.createProject);
router.put('/:id', validateParams(idParamSchema), validateBody(updateProjectApiSchema), projectController.updateProject);
router.delete('/:id', validateParams(idParamSchema), projectController.deleteProject);

export default router;
