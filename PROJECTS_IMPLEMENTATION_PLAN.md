# Projects Implementation Plan

## Overview
- Projects page replaces Jobs page as the main entry point
- All jobs must belong to a project (no standalone jobs)
- Projects are simple: just customer + name
- Jobs remain unchanged except for required project_id

## Database Changes

### 1. Create projects table (`database/migrations/16-add-projects.sql`)

```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
```

### 2. Modify jobs table

```sql
ALTER TABLE jobs 
ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX idx_jobs_project_id ON jobs(project_id);
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

### 2. Project Routes (`backend/src/routes/projects.ts`)
- `GET /api/projects` - list all projects
- `GET /api/projects/:id` - get project with jobs
- `POST /api/projects` - create project
- `PUT /api/projects/:id` - update project
- `DELETE /api/projects/:id` - delete project

### 3. Job Controller Updates
- `createJob` - require project_id parameter
- `getAllJobs` - filter by project_id when provided
- Remove customer_id requirement (inherit from project)

## Frontend Changes

### 1. Replace Jobs Page with Projects Page
- `frontend/src/pages/Projects.tsx` - main projects list page
- Remove `frontend/src/pages/Jobs.tsx`
- Update navigation to point to Projects instead of Jobs

### 2. Project Components (`frontend/src/components/projects/`)
- `ProjectList.tsx` - display projects with customer name and job count
- `ProjectForm.tsx` - simple form with customer dropdown and name field
- `ProjectDetail.tsx` - show project info and list of jobs (reuse existing job components)

### 3. Update Job Components
- `JobForm.tsx` - remove customer selection (inherit from project)
- `JobForm.tsx` - accept project_id as prop
- Job creation happens from within ProjectDetail view

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

### 5. Routing Updates
- `/projects` - list all projects
- `/projects/new` - create project
- `/projects/:id` - view project with jobs
- `/projects/:id/jobs/new` - create job within project

## Implementation Steps

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
- Create ProjectDetail component showing jobs
- Update JobForm to work within project context
- Remove customer selection from JobForm

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

### Deleted Files
- `frontend/src/pages/Jobs.tsx` - replaced by Projects.tsx

## Notes
- Maintain backward compatibility during migration
- All existing jobs will be assigned to auto-created projects
- Project names for migration: "Default Project - [Customer Name]"
- After migration, project_id becomes required for all new jobs