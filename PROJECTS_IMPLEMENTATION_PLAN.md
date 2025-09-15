# Jobs (Parent) Implementation Plan — Current Status

Naming note: The UI now uses “Jobs” for the parent container (stored in the `jobs` table). Item-level records remain “Job Items” (stored in `job_items`). The standalone Job Items page has been removed; `/jobs` is the single entry point.

## Overview (Updated)
- Jobs page (`/jobs`) is the main entry point (Job Items page removed)
- All Job Items belong to a Job (parent); creation flows live in Jobs and Job Detail
- Jobs are simple: customer + name (plus computed aggregates)
- Frontend naming aligns with UI: a `jobsService` alias re-exports the legacy `projectService`

## Database Changes

### 1. Create jobs table (already exists) and use as project container

```sql
-- Use existing `jobs` table for project-level container

-- Add indexes
-- Indices already present on `jobs` (customer_id, created_at)
```

### 2. Link job_items to jobs

```sql
-- `job_items.job_id` references `jobs.id` (already implemented)

-- Index present: `idx_job_items_job_id` on job_items(job_id)
```

### 3. Data Migration
- Create a default project for each customer with existing jobs
- Assign all existing jobs to their customer's default project
- Make project_id NOT NULL after migration

## Backend Changes

### 1. Project Controller (`backend/src/controllers/projectController.ts`)
- `getAllProjects` - list with customer info and job count
- `getProjectById` - get project with all its jobs
- `createProject` - simple create with customer_id and name
- `updateProject` - update name only
- `deleteProject` - delete if no jobs exist

### 2. Jobs Routes (project-level)
- `GET /api/jobs` - list jobs (project-level)
- `GET /api/jobs/:id` - get job with job items
- `POST /api/jobs` - create job
- `PUT /api/jobs/:id` - update job
- `DELETE /api/jobs/:id` - delete job

### 3. Job Controller Updates
- `createJob` - require project_id parameter
- `getAllJobs` - filter by project_id when provided
- Remove customer_id requirement (inherit from project)

## Frontend Changes

### 0. Refactor Prep (completed)
- Modularize existing Jobs feature to enable reuse inside Projects without changing behavior:
  - Jobs page split into presentational components under `frontend/src/pages/jobs/`:
    - `JobsHeader.tsx`, `JobsSearchSection.tsx`, `JobsAdvancedFiltersPanel.tsx`, `JobsErrorBanner.tsx`,
      `JobsGrid.tsx`, `JobsEmptyState.tsx`, `NextStageConfirmModal.tsx`.
  - Job Detail split into components under `frontend/src/components/jobs/job-detail/`:
    - `DetailHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`, `Summary.tsx`, `EditJobForm.tsx`,
      `JobInfoGrid.tsx`, `SectionsBlock.tsx`, `TotalsPanel.tsx`, `FooterActions.tsx`, `JobDetailErrorBoundary.tsx`.
  - Job Form extracted shared UI under `frontend/src/components/jobs/job-form/`:
    - `FormHeader.tsx`, `StepNavigation.tsx`, `TotalsSidebar.tsx`, `FormFooter.tsx`, `JobFormErrorBoundary.tsx`.
- Result: Smaller containers (`Jobs.tsx`, `JobDetail.tsx`, `JobForm.tsx`) and reusable parts to drop into `ProjectDetail`.

### 1. Replace Jobs Page with Projects Page
- `frontend/src/pages/Projects.tsx` - main projects list page
- Update navigation to point to Projects instead of Jobs
- Keep `frontend/src/pages/Jobs.tsx` temporarily as a wrapper during migration (now thin and modular). Remove after full cutover.

### 2. Project Components (`frontend/src/components/projects/`)
- `ProjectList.tsx` - display projects with customer name and job count
- `ProjectForm.tsx` - simple form with customer dropdown and name field
- `ProjectDetail.tsx` - show project info and list of jobs (reuse existing job components)

### 3. Update Job Components
- `JobForm.tsx` - remove customer selection (inherit from project)
- `JobForm.tsx` - accept `project_id` as prop
- Job creation happens from within ProjectDetail view
- Reuse refactored components (job-form/* and job-detail/*) inside project views.
  - TODO: Extract remaining JobForm sections into dedicated components to simplify project-context wiring without behavior changes:
    - `frontend/src/components/jobs/job-form/Step1BasicInfo.tsx` (title, status, description, customer/salesman block, job details). Should support a prop like `hideCustomer` when `project_id` is provided.
    - `frontend/src/components/jobs/job-form/Step3Review.tsx` (review summary + totals), consuming the same props derived from container state.

### 4. Service Layer (`frontend/src/services/projectService.ts`)

```typescript
export interface Project {
  id: number;
  customer_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  // Joined data
  customer_name?: string;
  job_count?: number;
  total_value?: number;
}
```

### 5. Routing Updates (frontend)
- `/jobs` - list all Jobs (parent-level)
- Job Detail opens as a modal from the grid or deep link state
- `/job-items` - removed

## Implementation Steps

### Step 0 - Frontend Refactor (completed)
- Extract Jobs page into presentational components (header, search, grid, modals).
- Extract Job Detail into components (header, summary, sections, totals, footer) ensuring stair configuration display parity.
- Extract Job Form scaffolding (header, step navigation, totals sidebar, footer, error boundary).

### Step 1 - Database
- Create and run migration for projects table
- Add project_id to jobs (nullable initially)

### Step 2 - Backend API
- Create project controller and routes
- Update app.ts to include project routes
- Update job controller to handle project_id

### Step 3 - Frontend Projects
- Create project service
- Build ProjectList and ProjectForm components
- Replace Jobs menu item with Projects

### Step 4 - Frontend Integration
- Create ProjectDetail component showing jobs (reuse jobs/job-detail components where possible)
- Update JobForm to work within project context (pass `project_id`, remove customer selection)
- Ensure stair configuration details render correctly within project context
  
  Follow-up TODOs (JobForm extraction):
  - Create `job-form/Step1BasicInfo.tsx` and migrate current Step 1 JSX without altering classNames.
  - Create `job-form/Step3Review.tsx` and migrate current Step 3 JSX unchanged.
  - Add a `projectId?: number` prop to `JobForm` container and pass it down to `Step1BasicInfo` to conditionally hide customer selection and validation.
  - Keep legacy mode (no `projectId`) fully functional until Jobs page is removed.
  - Verification: compile clean, UI parity on both legacy and project flows; stair config behavior unaffected.

### Step 5 - Data Migration
- Create migration script for existing jobs
- Make project_id NOT NULL after migration
- Test all workflows

## UI Flow
1. User clicks "Projects" in navigation
2. Sees list of all projects with customer name
3. Can create new project (select customer, enter name)
4. Clicks on project to see all its jobs
5. From project detail, can create new jobs (customer pre-selected)
6. All job operations happen within project context

## Files to be Modified/Created

### New Files
- `database/migrations/16-add-projects.sql`
- `backend/src/controllers/projectController.ts`
- `backend/src/routes/projects.ts`
- `frontend/src/pages/Projects.tsx`
- `frontend/src/components/projects/ProjectList.tsx`
- `frontend/src/components/projects/ProjectForm.tsx`
- `frontend/src/components/projects/ProjectDetail.tsx`
- `frontend/src/services/projectService.ts`

### Modified Files
- `backend/src/app.ts` - add project routes
- `backend/src/controllers/jobController.ts` - add project_id handling
- `frontend/src/App.tsx` - update routing
- `frontend/src/components/Layout.tsx` - change navigation from Jobs to Projects
- `frontend/src/components/jobs/JobForm.tsx` - remove customer selection, add project context
- `frontend/src/services/jobService.ts` - update Job interface with project_id

### Deleted Files (Completed)
- `frontend/src/pages/Jobs.tsx` and `frontend/src/pages/jobs/*` — removed with Job Items page
- `frontend/src/components/customers/CustomerJobs.tsx` — legacy modal removed

### Frontend Enhancements (Completed)
- Added deep-link handling to open Job Detail from Customers navigation
- Added Jobs header action for “Clear PDF Cache” (DELETE /api/job-items/cache/pdf)
- Introduced `.page-actions` for consistent header button alignment

## Notes
- Maintain backward compatibility during migration; Jobs routes/pages remain functional until cutover.
- All existing jobs will be assigned to auto-created projects.
- Project names for migration: "Default Project - [Customer Name]".
- After migration, `project_id` becomes required for all new jobs.
- The refactor ensures UI parity (including stair configuration display) and reduces risk by reusing components between Jobs and Projects.
