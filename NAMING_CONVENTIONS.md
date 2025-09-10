# Naming Conventions (Jobs → Job Items)

This repo uses the following consistent terminology across UI, API, and DB:

- Jobs: Project-level container of work for a customer.
  - Database: `jobs` table (id, customer_id, name, created_at, updated_at)
  - API routes: `/api/jobs/*`
  - Frontend routes: `/jobs`
  - Frontend UI: Labeled as “Jobs” in the sidebar and pages

- Job Items: Individual job records (quote/order/invoice) that belong to a Job.
  - Database: `job_items` table (with `job_items.job_id → jobs.id`)
  - API routes: `/api/job-items/*`
  - Frontend routes: `/job-items`
  - Frontend UI: Labeled as “Job Items” in the sidebar and pages

Related tables are aligned to Job Items:
- `job_sections.job_item_id`
- `quote_items.job_item_id`
- `stair_configurations.job_item_id`

Frontend services and forms:
- Creating a Job Item under a Job uses body field `job_id` (maps to `jobs.id` and is stored as `job_items.job_id`).
- Creating a Job Item without a Job uses body field `customer_id`.

Routes (canonical)
- Jobs (project-level): `/api/jobs`
- Job Items: `/api/job-items`

Guidelines
- UI labels: use “Jobs” for project-level, and “Job Items” for the individual records.
- Code identifiers: prefer `jobId` for Job Item id, and `projectId` (aka Job id) for the project-level id in UI-layer code; on the DB layer, use `job_id` for the Job Item → Job link.
- Do not introduce new “project_id” fields in DB. Use `job_id` for the relationship.
