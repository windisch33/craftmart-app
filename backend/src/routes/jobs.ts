import { Router } from 'express';
import * as jobController from '../controllers/jobController';

const router = Router();

// Main job routes
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);
router.get('/:id/details', jobController.getJobWithDetails);
router.post('/', jobController.createJob);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);

// Job sections routes
router.get('/:jobId/sections', jobController.getJobSections);
router.post('/:jobId/sections', jobController.createJobSection);
router.put('/sections/:sectionId', jobController.updateJobSection);
router.delete('/sections/:sectionId', jobController.deleteJobSection);

// Quote items routes
router.post('/:jobId/sections/:sectionId/items', jobController.addQuoteItem);
router.put('/items/:itemId', jobController.updateQuoteItem);
router.delete('/items/:itemId', jobController.deleteQuoteItem);

// PDF generation route
router.get('/:id/pdf', jobController.generateJobPDFEndpoint);

export default router;