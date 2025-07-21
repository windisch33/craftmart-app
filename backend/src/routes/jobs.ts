import { Router } from 'express';
import * as jobController from '../controllers/jobController';

const router = Router();

router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);
router.post('/', jobController.createJob);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);

export default router;