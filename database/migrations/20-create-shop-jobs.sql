-- Create table to map shops to the jobs included in each generation
CREATE TABLE IF NOT EXISTS shop_jobs (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES job_items(id) ON DELETE CASCADE,
    job_title VARCHAR(255),
    customer_name VARCHAR(255),
    job_location VARCHAR(255),
    delivery_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shop_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_jobs_shop_id ON shop_jobs(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_jobs_job_id ON shop_jobs(job_id);
