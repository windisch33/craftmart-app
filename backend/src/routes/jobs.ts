import { Router } from 'express';
import * as jobController from '../controllers/jobController';
import { validateBody, validateParams, idParamSchema, jobIdParamSchema, sectionIdParamSchema, itemIdParamSchema, jobAndSectionParamSchema } from '../middleware/validation';
import { createJobItemApiSchema, updateJobItemApiSchema, createJobSectionApiSchema, updateJobSectionApiSchema, addQuoteItemApiSchema, updateQuoteItemApiSchema } from '../validation/schemas';

const router = Router();

// Main job routes
router.get('/', jobController.getAllJobs);
router.get('/:id', validateParams(idParamSchema), jobController.getJobById);
router.get('/:id/details', validateParams(idParamSchema), jobController.getJobWithDetails);
router.post('/', validateBody(createJobItemApiSchema), jobController.createJob);
router.put('/:id', validateParams(idParamSchema), validateBody(updateJobItemApiSchema), jobController.updateJob);
router.delete('/:id', validateParams(idParamSchema), jobController.deleteJob);

// Job sections routes
router.get('/:jobId/sections', validateParams(jobIdParamSchema), jobController.getJobSections);
router.post('/:jobId/sections', validateParams(jobIdParamSchema), validateBody(createJobSectionApiSchema), jobController.createJobSection);
router.put('/sections/:sectionId', validateParams(sectionIdParamSchema), validateBody(updateJobSectionApiSchema), jobController.updateJobSection);
router.delete('/sections/:sectionId', validateParams(sectionIdParamSchema), jobController.deleteJobSection);

// Quote items routes
router.post('/:jobId/sections/:sectionId/items', validateParams(jobAndSectionParamSchema), validateBody(addQuoteItemApiSchema), jobController.addQuoteItem);
router.put('/items/:itemId', validateParams(itemIdParamSchema), validateBody(updateQuoteItemApiSchema), jobController.updateQuoteItem);
router.delete('/items/:itemId', validateParams(itemIdParamSchema), jobController.deleteQuoteItem);

// PDF generation route
router.get('/:id/pdf', validateParams(idParamSchema), jobController.generateJobPDFEndpoint);

// PDF cache management routes
router.delete('/cache/pdf', jobController.clearPDFCacheEndpoint); // Clear all cache
router.delete('/:jobId/cache/pdf', validateParams(jobIdParamSchema), jobController.clearPDFCacheEndpoint); // Clear specific job cache

export default router;
