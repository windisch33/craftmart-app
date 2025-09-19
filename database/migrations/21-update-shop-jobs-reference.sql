-- Adjust shop_jobs foreign key to point at job_items instead of jobs
ALTER TABLE shop_jobs
DROP CONSTRAINT IF EXISTS shop_jobs_job_id_fkey;

ALTER TABLE shop_jobs
ADD CONSTRAINT shop_jobs_job_id_fkey
FOREIGN KEY (job_id) REFERENCES job_items(id) ON DELETE CASCADE;
