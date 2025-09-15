import projectService, { projectService as namedProjectService } from './projectService';

// Alias the legacy projectService as jobsService (parent Jobs API)
export const jobsService = namedProjectService;
export default projectService;

