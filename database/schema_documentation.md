# CraftMart Database Schema Documentation

Generated on: Fri Sep 19 02:09:53 PM UTC 2025

## Database Overview

This document contains the complete schema for the CraftMart application database.

## Schema Statistics

   schema_stats   
------------------
 Total Tables: 23
(1 row)


## Tables Overview

| Table Name | Description | Row Count |
|------------|-------------|-----------|

## Core Business Tables

### users
Authentication and user management

                                                                     Table "public.users"
    Column     |            Type             | Collation | Nullable |              Default              | Storage  | Compression | Stats target | Description 
---------------+-----------------------------+-----------+----------+-----------------------------------+----------+-------------+--------------+-------------
 id            | integer                     |           | not null | nextval('users_id_seq'::regclass) | plain    |             |              | 
 email         | character varying(255)      |           | not null |                                   | extended |             |              | 
 password_hash | character varying(255)      |           | not null |                                   | extended |             |              | 
 first_name    | character varying(100)      |           | not null |                                   | extended |             |              | 
 last_name     | character varying(100)      |           | not null |                                   | extended |             |              | 
 role          | character varying(50)       |           |          | 'employee'::character varying     | extended |             |              | 
 is_active     | boolean                     |           |          | true                              | plain    |             |              | 
 last_login    | timestamp without time zone |           |          |                                   | plain    |             |              | 
 created_at    | timestamp without time zone |           |          | CURRENT_TIMESTAMP                 | plain    |             |              | 
 updated_at    | timestamp without time zone |           |          | CURRENT_TIMESTAMP                 | plain    |             |              | 
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "idx_users_email" btree (email)
    "idx_users_role" btree (role)
    "users_email_key" UNIQUE CONSTRAINT, btree (email)
Check constraints:
    "users_role_check" CHECK (role::text = ANY (ARRAY['admin'::character varying, 'employee'::character varying]::text[]))
Referenced by:
    TABLE "deposit_allocations" CONSTRAINT "deposit_allocations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id)
    TABLE "deposits" CONSTRAINT "deposits_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id)
Access method: heap


### customers
Customer contact and address information

                                                                      Table "public.customers"
      Column      |            Type             | Collation | Nullable |                Default                | Storage  | Compression | Stats target | Description 
------------------+-----------------------------+-----------+----------+---------------------------------------+----------+-------------+--------------+-------------
 id               | integer                     |           | not null | nextval('customers_id_seq'::regclass) | plain    |             |              | 
 name             | character varying(255)      |           | not null |                                       | extended |             |              | 
 address          | text                        |           |          |                                       | extended |             |              | 
 city             | character varying(100)      |           |          |                                       | extended |             |              | 
 state            | character varying(50)       |           |          |                                       | extended |             |              | 
 zip_code         | character varying(20)       |           |          |                                       | extended |             |              | 
 phone            | character varying(20)       |           |          |                                       | extended |             |              | 
 mobile           | character varying(20)       |           |          |                                       | extended |             |              | 
 fax              | character varying(20)       |           |          |                                       | extended |             |              | 
 email            | character varying(255)      |           |          |                                       | extended |             |              | 
 accounting_email | character varying(255)      |           |          |                                       | extended |             |              | 
 notes            | text                        |           |          |                                       | extended |             |              | 
 created_at       | timestamp without time zone |           |          | CURRENT_TIMESTAMP                     | plain    |             |              | 
 updated_at       | timestamp without time zone |           |          | CURRENT_TIMESTAMP                     | plain    |             |              | 
 last_visited_at  | timestamp without time zone |           |          |                                       | plain    |             |              | 
Indexes:
    "customers_pkey" PRIMARY KEY, btree (id)
    "idx_customers_email" btree (email)
    "idx_customers_last_visited" btree (last_visited_at DESC)
Referenced by:
    TABLE "deposits" CONSTRAINT "deposits_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    TABLE "job_items" CONSTRAINT "jobs_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    TABLE "jobs" CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
Access method: heap


### salesmen
Sales representative information and commission tracking

                                                                      Table "public.salesmen"
     Column      |            Type             | Collation | Nullable |               Default                | Storage  | Compression | Stats target | Description 
-----------------+-----------------------------+-----------+----------+--------------------------------------+----------+-------------+--------------+-------------
 id              | integer                     |           | not null | nextval('salesmen_id_seq'::regclass) | plain    |             |              | 
 first_name      | character varying(100)      |           | not null |                                      | extended |             |              | 
 last_name       | character varying(100)      |           | not null |                                      | extended |             |              | 
 email           | character varying(255)      |           |          |                                      | extended |             |              | 
 phone           | character varying(20)       |           |          |                                      | extended |             |              | 
 commission_rate | numeric(5,2)                |           |          | 0.00                                 | main     |             |              | 
 is_active       | boolean                     |           |          | true                                 | plain    |             |              | 
 notes           | text                        |           |          |                                      | extended |             |              | 
 created_at      | timestamp without time zone |           |          | CURRENT_TIMESTAMP                    | plain    |             |              | 
 updated_at      | timestamp without time zone |           |          | CURRENT_TIMESTAMP                    | plain    |             |              | 
Indexes:
    "salesmen_pkey" PRIMARY KEY, btree (id)
Check constraints:
    "salesmen_commission_rate_check" CHECK (commission_rate >= 0::numeric)
Referenced by:
    TABLE "job_items" CONSTRAINT "jobs_salesman_id_fkey" FOREIGN KEY (salesman_id) REFERENCES salesmen(id)
Access method: heap


## Jobs Workflow Tables

**Note:** The database uses a hierarchical structure where `jobs` acts as project groupings, and `job_items` contains the actual quote/order/invoice records.

### jobs
Project groupings for customers (internally projects table)

                                                                       Table "public.jobs"
     Column     |            Type             | Collation | Nullable |               Default                | Storage  | Compression | Stats target | Description 
----------------+-----------------------------+-----------+----------+--------------------------------------+----------+-------------+--------------+-------------
 id             | integer                     |           | not null | nextval('projects_id_seq'::regclass) | plain    |             |              | 
 customer_id    | integer                     |           | not null |                                      | plain    |             |              | 
 name           | character varying(255)      |           | not null |                                      | extended |             |              | 
 created_at     | timestamp without time zone |           |          | CURRENT_TIMESTAMP                    | plain    |             |              | 
 updated_at     | timestamp without time zone |           |          | CURRENT_TIMESTAMP                    | plain    |             |              | 
 shops_run      | boolean                     |           |          | false                                | plain    |             |              | 
 shops_run_date | timestamp without time zone |           |          |                                      | plain    |             |              | 
Indexes:
    "projects_pkey" PRIMARY KEY, btree (id)
    "idx_jobs_created_at" btree (created_at DESC)
    "idx_jobs_customer_id" btree (customer_id)
Foreign-key constraints:
    "projects_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
Referenced by:
    TABLE "deposit_allocations" CONSTRAINT "deposit_allocations_job_id_fkey" FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    TABLE "job_items" CONSTRAINT "job_items_job_id_fkey" FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
Triggers:
    trigger_update_projects_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_projects_updated_at()
    update_projects_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
Access method: heap


### job_items
Main job records - quotes, orders, and invoices (ACTIVE workflow table)

                                                                                                      Table "public.job_items"
      Column       |            Type             | Collation | Nullable |             Default              | Storage  | Compression | Stats target |                                   Description                                   
-------------------+-----------------------------+-----------+----------+----------------------------------+----------+-------------+--------------+---------------------------------------------------------------------------------
 id                | integer                     |           | not null | nextval('jobs_id_seq'::regclass) | plain    |             |              | 
 customer_id       | integer                     |           |          |                                  | plain    |             |              | 
 title             | character varying(255)      |           | not null |                                  | extended |             |              | 
 description       | text                        |           |          |                                  | extended |             |              | 
 status            | character varying(50)       |           |          | 'quote'::character varying       | extended |             |              | 
 quote_amount      | numeric(10,2)               |           |          |                                  | main     |             |              | 
 order_amount      | numeric(10,2)               |           |          |                                  | main     |             |              | 
 invoice_amount    | numeric(10,2)               |           |          |                                  | main     |             |              | 
 created_at        | timestamp without time zone |           |          | CURRENT_TIMESTAMP                | plain    |             |              | 
 updated_at        | timestamp without time zone |           |          | CURRENT_TIMESTAMP                | plain    |             |              | 
 salesman_id       | integer                     |           |          |                                  | plain    |             |              | 
 delivery_date     | date                        |           |          |                                  | plain    |             |              | 
 job_location      | text                        |           |          |                                  | extended |             |              | 
 order_designation | character varying(100)      |           |          |                                  | extended |             |              | 
 model_name        | character varying(255)      |           |          |                                  | extended |             |              | 
 installer         | character varying(255)      |           |          |                                  | extended |             |              | 
 terms             | character varying(255)      |           |          |                                  | extended |             |              | 
 show_line_pricing | boolean                     |           |          | true                             | plain    |             |              | 
 subtotal          | numeric(10,2)               |           |          | 0.00                             | main     |             |              | 
 labor_total       | numeric(10,2)               |           |          | 0.00                             | main     |             |              | 
 tax_rate          | numeric(5,4)                |           |          | 0.00                             | main     |             |              | 
 tax_amount        | numeric(10,2)               |           |          | 0.00                             | main     |             |              | 
 total_amount      | numeric(10,2)               |           |          | 0.00                             | main     |             |              | 
 shops_run         | boolean                     |           |          | false                            | plain    |             |              | Indicates if shop cut sheets have been generated for this job
 shops_run_date    | timestamp without time zone |           |          |                                  | plain    |             |              | Timestamp when shops were last generated for this job
 job_id            | integer                     |           | not null |                                  | plain    |             |              | Required reference to projects table. Jobs inherit customer from their project.
Indexes:
    "jobs_pkey" PRIMARY KEY, btree (id)
    "idx_job_items_created_at" btree (created_at DESC)
    "idx_job_items_customer_id" btree (customer_id)
    "idx_job_items_delivery_date" btree (delivery_date)
    "idx_job_items_job_id" btree (job_id)
    "idx_job_items_salesman_id" btree (salesman_id)
    "idx_job_items_status" btree (status)
    "idx_jobs_shops_run" btree (shops_run)
    "idx_jobs_shops_run_status" btree (status, shops_run)
Check constraints:
    "jobs_status_check" CHECK (status::text = ANY (ARRAY['quote'::character varying, 'order'::character varying, 'invoice'::character varying]::text[]))
Foreign-key constraints:
    "job_items_job_id_fkey" FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    "jobs_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    "jobs_salesman_id_fkey" FOREIGN KEY (salesman_id) REFERENCES salesmen(id)
Referenced by:
    TABLE "deposit_allocations" CONSTRAINT "deposit_allocations_job_item_id_fkey" FOREIGN KEY (job_item_id) REFERENCES job_items(id) ON DELETE CASCADE
    TABLE "job_sections" CONSTRAINT "job_sections_job_item_id_fkey" FOREIGN KEY (job_item_id) REFERENCES job_items(id) ON DELETE CASCADE
    TABLE "quote_items" CONSTRAINT "quote_items_job_item_id_fkey" FOREIGN KEY (job_item_id) REFERENCES job_items(id) ON DELETE CASCADE
    TABLE "shop_jobs" CONSTRAINT "shop_jobs_job_id_fkey" FOREIGN KEY (job_id) REFERENCES job_items(id) ON DELETE CASCADE
    TABLE "shops" CONSTRAINT "shops_job_item_id_fkey" FOREIGN KEY (job_item_id) REFERENCES job_items(id) ON DELETE CASCADE
    TABLE "stair_configurations" CONSTRAINT "stair_configurations_job_item_id_fkey" FOREIGN KEY (job_item_id) REFERENCES job_items(id) ON DELETE CASCADE
Access method: heap


### job_sections
Job organization into sections

                                                                     Table "public.job_sections"
    Column     |            Type             | Collation | Nullable |                 Default                  | Storage  | Compression | Stats target | Description 
---------------+-----------------------------+-----------+----------+------------------------------------------+----------+-------------+--------------+-------------
 id            | integer                     |           | not null | nextval('job_sections_id_seq'::regclass) | plain    |             |              | 
 job_item_id   | integer                     |           |          |                                          | plain    |             |              | 
 name          | character varying(100)      |           | not null |                                          | extended |             |              | 
 display_order | integer                     |           |          | 0                                        | plain    |             |              | 
 created_at    | timestamp without time zone |           |          | CURRENT_TIMESTAMP                        | plain    |             |              | 
 updated_at    | timestamp without time zone |           |          | CURRENT_TIMESTAMP                        | plain    |             |              | 
Indexes:
    "job_sections_pkey" PRIMARY KEY, btree (id)
    "idx_job_sections_job_item_id" btree (job_item_id)
Foreign-key constraints:
    "job_sections_job_item_id_fkey" FOREIGN KEY (job_item_id) REFERENCES job_items(id) ON DELETE CASCADE
Referenced by:
    TABLE "quote_items" CONSTRAINT "quote_items_section_id_fkey" FOREIGN KEY (section_id) REFERENCES job_sections(id) ON DELETE CASCADE
Access method: heap


### quote_items
Line items for jobs with pricing details

                                                                        Table "public.quote_items"
       Column        |            Type             | Collation | Nullable |                 Default                 | Storage  | Compression | Stats target | Description 
---------------------+-----------------------------+-----------+----------+-----------------------------------------+----------+-------------+--------------+-------------
 id                  | integer                     |           | not null | nextval('quote_items_id_seq'::regclass) | plain    |             |              | 
 job_item_id         | integer                     |           |          |                                         | plain    |             |              | 
 product_id          | integer                     |           |          |                                         | plain    |             |              | 
 product_type        | character varying(50)       |           | not null |                                         | extended |             |              | 
 product_name        | character varying(255)      |           | not null |                                         | extended |             |              | 
 length_inches       | integer                     |           |          |                                         | plain    |             |              | 
 material_id         | integer                     |           |          |                                         | plain    |             |              | 
 material_name       | character varying(255)      |           |          |                                         | extended |             |              | 
 material_multiplier | numeric(5,3)                |           |          |                                         | main     |             |              | 
 include_labor       | boolean                     |           |          | false                                   | plain    |             |              | 
 unit_cost           | numeric(8,2)                |           |          |                                         | main     |             |              | 
 labor_cost          | numeric(8,2)                |           |          |                                         | main     |             |              | 
 total_cost          | numeric(10,2)               |           |          |                                         | main     |             |              | 
 created_at          | timestamp without time zone |           |          | CURRENT_TIMESTAMP                       | plain    |             |              | 
 section_id          | integer                     |           |          |                                         | plain    |             |              | 
 part_number         | character varying(100)      |           |          |                                         | extended |             |              | 
 description         | text                        |           |          |                                         | extended |             |              | 
 quantity            | numeric(8,2)                |           |          | 1                                       | main     |             |              | 
 unit_price          | numeric(8,2)                |           |          |                                         | main     |             |              | 
 line_total          | numeric(10,2)               |           |          |                                         | main     |             |              | 
 is_taxable          | boolean                     |           |          | true                                    | plain    |             |              | 
 stair_config_id     | integer                     |           |          |                                         | plain    |             |              | 
Indexes:
    "quote_items_pkey" PRIMARY KEY, btree (id)
    "idx_quote_items_job_item_id" btree (job_item_id)
    "idx_quote_items_material_id" btree (material_id)
    "idx_quote_items_product_id" btree (product_id)
    "idx_quote_items_stair_config" btree (stair_config_id)
Check constraints:
    "quote_items_length_inches_check" CHECK (length_inches > 0)
Foreign-key constraints:
    "quote_items_job_item_id_fkey" FOREIGN KEY (job_item_id) REFERENCES job_items(id) ON DELETE CASCADE
    "quote_items_material_id_fkey" FOREIGN KEY (material_id) REFERENCES materials(id)
    "quote_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id)
    "quote_items_section_id_fkey" FOREIGN KEY (section_id) REFERENCES job_sections(id) ON DELETE CASCADE
    "quote_items_stair_config_id_fkey" FOREIGN KEY (stair_config_id) REFERENCES stair_configurations(id) ON DELETE SET NULL
Access method: heap


## Product Catalog Tables

### products
Base product catalog

                                                                    Table "public.products"
    Column    |            Type             | Collation | Nullable |               Default                | Storage  | Compression | Stats target | Description 
--------------+-----------------------------+-----------+----------+--------------------------------------+----------+-------------+--------------+-------------
 id           | integer                     |           | not null | nextval('products_id_seq'::regclass) | plain    |             |              | 
 name         | character varying(255)      |           | not null |                                      | extended |             |              | 
 product_type | character varying(50)       |           | not null |                                      | extended |             |              | 
 is_active    | boolean                     |           |          | true                                 | plain    |             |              | 
 created_at   | timestamp without time zone |           |          | CURRENT_TIMESTAMP                    | plain    |             |              | 
 updated_at   | timestamp without time zone |           |          | CURRENT_TIMESTAMP                    | plain    |             |              | 
Indexes:
    "products_pkey" PRIMARY KEY, btree (id)
    "idx_products_active" btree (is_active)
    "idx_products_type" btree (product_type)
Check constraints:
    "products_product_type_check" CHECK (product_type::text = ANY (ARRAY['handrail'::character varying, 'newel'::character varying, 'baluster'::character varying, 'landing_tread'::character varying, 'rail_parts'::character varying, 'stair'::character varying, 'other'::character varying]::text[]))
Referenced by:
    TABLE "handrail_products" CONSTRAINT "handrail_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    TABLE "landing_tread_products" CONSTRAINT "landing_tread_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    TABLE "quote_items" CONSTRAINT "quote_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id)
    TABLE "rail_parts_products" CONSTRAINT "rail_parts_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
Access method: heap


### handrail_products
Handrail products with per-6-inch pricing

                                                               Table "public.handrail_products"
      Column       |     Type     | Collation | Nullable |                    Default                    | Storage | Compression | Stats target | Description 
-------------------+--------------+-----------+----------+-----------------------------------------------+---------+-------------+--------------+-------------
 id                | integer      |           | not null | nextval('handrail_products_id_seq'::regclass) | plain   |             |              | 
 product_id        | integer      |           |          |                                               | plain   |             |              | 
 cost_per_6_inches | numeric(8,2) |           | not null |                                               | main    |             |              | 
Indexes:
    "handrail_products_pkey" PRIMARY KEY, btree (id)
    "handrail_products_product_id_key" UNIQUE CONSTRAINT, btree (product_id)
    "idx_handrail_products_product_id" btree (product_id)
Check constraints:
    "handrail_products_cost_per_6_inches_check" CHECK (cost_per_6_inches >= 0::numeric)
Foreign-key constraints:
    "handrail_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
Access method: heap


### landing_tread_products
Landing tread products with per-6-inch pricing

                                                               Table "public.landing_tread_products"
       Column       |     Type     | Collation | Nullable |                      Default                       | Storage | Compression | Stats target | Description 
--------------------+--------------+-----------+----------+----------------------------------------------------+---------+-------------+--------------+-------------
 id                 | integer      |           | not null | nextval('landing_tread_products_id_seq'::regclass) | plain   |             |              | 
 product_id         | integer      |           |          |                                                    | plain   |             |              | 
 cost_per_6_inches  | numeric(8,2) |           | not null |                                                    | main    |             |              | 
 labor_install_cost | numeric(8,2) |           | not null |                                                    | main    |             |              | 
Indexes:
    "landing_tread_products_pkey" PRIMARY KEY, btree (id)
    "idx_landing_tread_products_product_id" btree (product_id)
    "landing_tread_products_product_id_key" UNIQUE CONSTRAINT, btree (product_id)
Check constraints:
    "landing_tread_products_cost_per_6_inches_check" CHECK (cost_per_6_inches >= 0::numeric)
    "landing_tread_products_labor_install_cost_check" CHECK (labor_install_cost >= 0::numeric)
Foreign-key constraints:
    "landing_tread_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
Access method: heap


### rail_parts_products
Rail parts with base pricing

                                                               Table "public.rail_parts_products"
       Column       |     Type     | Collation | Nullable |                     Default                     | Storage | Compression | Stats target | Description 
--------------------+--------------+-----------+----------+-------------------------------------------------+---------+-------------+--------------+-------------
 id                 | integer      |           | not null | nextval('rail_parts_products_id_seq'::regclass) | plain   |             |              | 
 product_id         | integer      |           |          |                                                 | plain   |             |              | 
 base_price         | numeric(8,2) |           | not null |                                                 | main    |             |              | 
 labor_install_cost | numeric(8,2) |           | not null |                                                 | main    |             |              | 
Indexes:
    "rail_parts_products_pkey" PRIMARY KEY, btree (id)
    "idx_rail_parts_products_product_id" btree (product_id)
    "rail_parts_products_product_id_key" UNIQUE CONSTRAINT, btree (product_id)
Check constraints:
    "rail_parts_products_base_price_check" CHECK (base_price >= 0::numeric)
    "rail_parts_products_labor_install_cost_check" CHECK (labor_install_cost >= 0::numeric)
Foreign-key constraints:
    "rail_parts_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
Access method: heap


## Materials and Pricing Tables

### materials
Legacy materials table (deprecated)

                                                                    Table "public.materials"
   Column    |            Type             | Collation | Nullable |                Default                | Storage  | Compression | Stats target | Description 
-------------+-----------------------------+-----------+----------+---------------------------------------+----------+-------------+--------------+-------------
 id          | integer                     |           | not null | nextval('materials_id_seq'::regclass) | plain    |             |              | 
 name        | character varying(255)      |           | not null |                                       | extended |             |              | 
 multiplier  | numeric(5,3)                |           | not null |                                       | main     |             |              | 
 description | text                        |           |          |                                       | extended |             |              | 
 is_active   | boolean                     |           |          | true                                  | plain    |             |              | 
 created_at  | timestamp without time zone |           |          | CURRENT_TIMESTAMP                     | plain    |             |              | 
 updated_at  | timestamp without time zone |           |          | CURRENT_TIMESTAMP                     | plain    |             |              | 
Indexes:
    "materials_pkey" PRIMARY KEY, btree (id)
    "idx_materials_active" btree (is_active)
Check constraints:
    "materials_multiplier_check" CHECK (multiplier > 0::numeric)
Referenced by:
    TABLE "quote_items" CONSTRAINT "quote_items_material_id_fkey" FOREIGN KEY (material_id) REFERENCES materials(id)
Access method: heap


### material_multipliers
Material pricing multipliers for simplified pricing system

                                                     Table "public.material_multipliers"
    Column     |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
---------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 material_id   | integer                     |           | not null |                   | plain    |             |              | 
 material_name | character varying(50)       |           | not null |                   | extended |             |              | 
 abbreviation  | character varying(5)        |           |          |                   | extended |             |              | 
 multiplier    | numeric(5,2)                |           | not null | 1.0               | main     |             |              | 
 is_active     | boolean                     |           |          | true              | plain    |             |              | 
 display_order | integer                     |           |          | 100               | plain    |             |              | 
 created_at    | timestamp without time zone |           |          | CURRENT_TIMESTAMP | plain    |             |              | 
 updated_at    | timestamp without time zone |           |          | CURRENT_TIMESTAMP | plain    |             |              | 
Indexes:
    "material_multipliers_pkey" PRIMARY KEY, btree (material_id)
Referenced by:
    TABLE "stair_config_items" CONSTRAINT "stair_config_items_material_id_fkey" FOREIGN KEY (material_id) REFERENCES material_multipliers(material_id)
    TABLE "stair_configurations" CONSTRAINT "stair_configurations_center_stringer_material_id_fkey" FOREIGN KEY (center_stringer_material_id) REFERENCES material_multipliers(material_id)
    TABLE "stair_configurations" CONSTRAINT "stair_configurations_left_stringer_material_id_fkey" FOREIGN KEY (left_stringer_material_id) REFERENCES material_multipliers(material_id)
    TABLE "stair_configurations" CONSTRAINT "stair_configurations_right_stringer_material_id_fkey" FOREIGN KEY (right_stringer_material_id) REFERENCES material_multipliers(material_id)
    TABLE "stair_configurations" CONSTRAINT "stair_configurations_riser_material_id_fkey" FOREIGN KEY (riser_material_id) REFERENCES material_multipliers(material_id)
    TABLE "stair_configurations" CONSTRAINT "stair_configurations_stringer_material_id_fkey" FOREIGN KEY (stringer_material_id) REFERENCES material_multipliers(material_id)
    TABLE "stair_configurations" CONSTRAINT "stair_configurations_tread_material_id_fkey" FOREIGN KEY (tread_material_id) REFERENCES material_multipliers(material_id)
    TABLE "stair_special_parts" CONSTRAINT "stair_special_parts_mat_seq_n_fkey" FOREIGN KEY (mat_seq_n) REFERENCES material_multipliers(material_id)
Access method: heap


## Stair Pricing System Tables

### stair_board_types
Board type definitions for stair components

                                                                   Table "public.stair_board_types"
   Column   |            Type             | Collation | Nullable |                    Default                    | Storage  | Compression | Stats target | Description 
------------+-----------------------------+-----------+----------+-----------------------------------------------+----------+-------------+--------------+-------------
 id         | integer                     |           | not null | nextval('stair_board_types_id_seq'::regclass) | plain    |             |              | 
 brd_typ_id | integer                     |           | not null |                                               | plain    |             |              | 
 brdtyp_des | character varying(100)      |           | not null |                                               | extended |             |              | 
 purpose    | text                        |           |          |                                               | extended |             |              | 
 pric_riser | boolean                     |           |          | false                                         | plain    |             |              | 
 pric_bxris | boolean                     |           |          | false                                         | plain    |             |              | 
 pric_opris | boolean                     |           |          | false                                         | plain    |             |              | 
 pric_doris | boolean                     |           |          | false                                         | plain    |             |              | 
 is_active  | boolean                     |           |          | true                                          | plain    |             |              | 
 created_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP                             | plain    |             |              | 
 updated_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP                             | plain    |             |              | 
Indexes:
    "stair_board_types_pkey" PRIMARY KEY, btree (id)
    "idx_stair_board_types_active" btree (is_active)
    "idx_stair_board_types_id" btree (brd_typ_id)
    "stair_board_types_brd_typ_id_key" UNIQUE CONSTRAINT, btree (brd_typ_id)
Referenced by:
    TABLE "stair_config_items" CONSTRAINT "stair_config_items_board_type_id_fkey" FOREIGN KEY (board_type_id) REFERENCES stair_board_types(brd_typ_id)
    TABLE "stair_pricing_simple" CONSTRAINT "stair_pricing_simple_board_type_id_fkey" FOREIGN KEY (board_type_id) REFERENCES stair_board_types(brd_typ_id)
Access method: heap


### stair_pricing_simple
Simplified formula-based pricing system

                                                                                                           Table "public.stair_pricing_simple"
         Column         |            Type             | Collation | Nullable |                     Default                      | Storage | Compression | Stats target |                                   Description                                   
------------------------+-----------------------------+-----------+----------+--------------------------------------------------+---------+-------------+--------------+---------------------------------------------------------------------------------
 id                     | integer                     |           | not null | nextval('stair_pricing_simple_id_seq'::regclass) | plain   |             |              | 
 board_type_id          | integer                     |           | not null |                                                  | plain   |             |              | 
 base_price             | numeric(10,2)               |           | not null |                                                  | main    |             |              | 
 length_increment_price | numeric(10,2)               |           |          | 1.50                                             | main    |             |              | 
 width_increment_price  | numeric(10,2)               |           |          | 2.25                                             | main    |             |              | 
 mitre_price            | numeric(10,2)               |           |          | 0                                                | main    |             |              | 
 base_length            | integer                     |           |          | 36                                               | plain   |             |              | 
 base_width             | integer                     |           |          | 9                                                | plain   |             |              | 
 length_increment_size  | numeric(10,2)               |           |          | 6                                                | main    |             |              | Increment size in inches for length pricing (supports decimal values like 0.25)
 is_active              | boolean                     |           |          | true                                             | plain   |             |              | 
 created_at             | timestamp without time zone |           |          | CURRENT_TIMESTAMP                                | plain   |             |              | 
 updated_at             | timestamp without time zone |           |          | CURRENT_TIMESTAMP                                | plain   |             |              | 
 width_increment_size   | numeric(10,2)               |           |          | 1                                                | main    |             |              | Increment size in inches for width pricing (supports decimal values like 0.25)
Indexes:
    "stair_pricing_simple_pkey" PRIMARY KEY, btree (id)
    "stair_pricing_simple_board_type_id_key" UNIQUE CONSTRAINT, btree (board_type_id)
Check constraints:
    "chk_increment_sizes_positive" CHECK (length_increment_size > 0::numeric AND width_increment_size > 0::numeric)
Foreign-key constraints:
    "stair_pricing_simple_board_type_id_fkey" FOREIGN KEY (board_type_id) REFERENCES stair_board_types(brd_typ_id)
Access method: heap


### stair_special_parts
Special stair components and add-ons

                                                                   Table "public.stair_special_parts"
   Column   |            Type             | Collation | Nullable |                     Default                     | Storage  | Compression | Stats target | Description 
------------+-----------------------------+-----------+----------+-------------------------------------------------+----------+-------------+--------------+-------------
 id         | integer                     |           | not null | nextval('stair_special_parts_id_seq'::regclass) | plain    |             |              | 
 stpart_id  | integer                     |           | not null |                                                 | plain    |             |              | 
 stpar_desc | character varying(100)      |           | not null |                                                 | extended |             |              | 
 mat_seq_n  | integer                     |           |          |                                                 | plain    |             |              | 
 position   | character varying(10)       |           |          |                                                 | extended |             |              | 
 unit_cost  | numeric(10,2)               |           | not null |                                                 | main     |             |              | 
 labor_cost | numeric(10,2)               |           |          | 0                                               | main     |             |              | 
 is_active  | boolean                     |           |          | true                                            | plain    |             |              | 
 created_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP                               | plain    |             |              | 
 updated_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP                               | plain    |             |              | 
Indexes:
    "stair_special_parts_pkey" PRIMARY KEY, btree (id)
    "idx_stair_special_parts_active" btree (is_active)
    "idx_stair_special_parts_lookup" btree (stpart_id, mat_seq_n)
Foreign-key constraints:
    "stair_special_parts_mat_seq_n_fkey" FOREIGN KEY (mat_seq_n) REFERENCES material_multipliers(material_id)
Access method: heap


### stair_configurations
Saved stair configurations

                                                                                                                Table "public.stair_configurations"
           Column            |            Type             | Collation | Nullable |                               Default                               | Storage  | Compression | Stats target |                           Description                            
-----------------------------+-----------------------------+-----------+----------+---------------------------------------------------------------------+----------+-------------+--------------+------------------------------------------------------------------
 id                          | integer                     |           | not null | nextval('stair_configurations_id_seq'::regclass)                    | plain    |             |              | 
 job_item_id                 | integer                     |           |          |                                                                     | plain    |             |              | 
 config_name                 | character varying(255)      |           |          |                                                                     | extended |             |              | 
 floor_to_floor              | numeric(8,2)                |           | not null |                                                                     | main     |             |              | 
 num_risers                  | integer                     |           | not null |                                                                     | plain    |             |              | 
 riser_height                | numeric(6,3)                |           |          | generated always as ((floor_to_floor / num_risers::numeric)) stored | main     |             |              | 
 tread_material_id           | integer                     |           |          |                                                                     | plain    |             |              | 
 riser_material_id           | integer                     |           |          |                                                                     | plain    |             |              | 
 tread_size                  | character varying(100)      |           |          |                                                                     | extended |             |              | Legacy combined tread size string (maintained for compatibility)
 nose_size                   | numeric(6,3)                |           |          |                                                                     | main     |             |              | Overhang/bullnose size in inches
 stringer_type               | character varying(100)      |           |          |                                                                     | extended |             |              | 
 stringer_material_id        | integer                     |           |          |                                                                     | plain    |             |              | 
 num_stringers               | integer                     |           |          | 2                                                                   | plain    |             |              | 
 center_horses               | integer                     |           |          | 0                                                                   | plain    |             |              | 
 full_mitre                  | boolean                     |           |          | false                                                               | plain    |             |              | 
 bracket_type                | character varying(100)      |           |          |                                                                     | extended |             |              | 
 subtotal                    | numeric(10,2)               |           |          |                                                                     | main     |             |              | 
 labor_total                 | numeric(10,2)               |           |          |                                                                     | main     |             |              | 
 tax_amount                  | numeric(10,2)               |           |          |                                                                     | main     |             |              | 
 total_amount                | numeric(10,2)               |           |          |                                                                     | main     |             |              | 
 special_notes               | text                        |           |          |                                                                     | extended |             |              | 
 created_at                  | timestamp without time zone |           |          | CURRENT_TIMESTAMP                                                   | plain    |             |              | 
 updated_at                  | timestamp without time zone |           |          | CURRENT_TIMESTAMP                                                   | plain    |             |              | 
 rough_cut_width             | numeric(6,3)                |           |          |                                                                     | main     |             |              | Width of rough cut tread lumber in inches (before nose is added)
 left_stringer_width         | numeric(6,3)                |           |          |                                                                     | main     |             |              | 
 left_stringer_thickness     | numeric(6,3)                |           |          |                                                                     | main     |             |              | 
 left_stringer_material_id   | integer                     |           |          |                                                                     | plain    |             |              | 
 right_stringer_width        | numeric(6,3)                |           |          |                                                                     | main     |             |              | 
 right_stringer_thickness    | numeric(6,3)                |           |          |                                                                     | main     |             |              | 
 right_stringer_material_id  | integer                     |           |          |                                                                     | plain    |             |              | 
 center_stringer_width       | numeric(6,3)                |           |          |                                                                     | main     |             |              | 
 center_stringer_thickness   | numeric(6,3)                |           |          |                                                                     | main     |             |              | 
 center_stringer_material_id | integer                     |           |          |                                                                     | plain    |             |              | 
Indexes:
    "stair_configurations_pkey" PRIMARY KEY, btree (id)
    "idx_stair_config_rough_cut" btree (rough_cut_width)
    "idx_stair_configurations_job_item_id" btree (job_item_id)
Check constraints:
    "chk_nose_size" CHECK (nose_size >= 0.25 AND nose_size <= 3.0)
    "chk_rough_cut_width" CHECK (rough_cut_width >= 6.0 AND rough_cut_width <= 24.0)
Foreign-key constraints:
    "stair_configurations_center_stringer_material_id_fkey" FOREIGN KEY (center_stringer_material_id) REFERENCES material_multipliers(material_id)
    "stair_configurations_job_item_id_fkey" FOREIGN KEY (job_item_id) REFERENCES job_items(id) ON DELETE CASCADE
    "stair_configurations_left_stringer_material_id_fkey" FOREIGN KEY (left_stringer_material_id) REFERENCES material_multipliers(material_id)
    "stair_configurations_right_stringer_material_id_fkey" FOREIGN KEY (right_stringer_material_id) REFERENCES material_multipliers(material_id)
    "stair_configurations_riser_material_id_fkey" FOREIGN KEY (riser_material_id) REFERENCES material_multipliers(material_id)
    "stair_configurations_stringer_material_id_fkey" FOREIGN KEY (stringer_material_id) REFERENCES material_multipliers(material_id)
    "stair_configurations_tread_material_id_fkey" FOREIGN KEY (tread_material_id) REFERENCES material_multipliers(material_id)
Referenced by:
    TABLE "quote_items" CONSTRAINT "quote_items_stair_config_id_fkey" FOREIGN KEY (stair_config_id) REFERENCES stair_configurations(id) ON DELETE SET NULL
    TABLE "stair_config_items" CONSTRAINT "stair_config_items_config_id_fkey" FOREIGN KEY (config_id) REFERENCES stair_configurations(id) ON DELETE CASCADE
Access method: heap


### stair_config_items
Line items for stair configurations

                                                                      Table "public.stair_config_items"
     Column      |            Type             | Collation | Nullable |                    Default                     | Storage  | Compression | Stats target | Description 
-----------------+-----------------------------+-----------+----------+------------------------------------------------+----------+-------------+--------------+-------------
 id              | integer                     |           | not null | nextval('stair_config_items_id_seq'::regclass) | plain    |             |              | 
 config_id       | integer                     |           |          |                                                | plain    |             |              | 
 item_type       | character varying(50)       |           | not null |                                                | extended |             |              | 
 riser_number    | integer                     |           |          |                                                | plain    |             |              | 
 tread_type      | character varying(50)       |           |          |                                                | extended |             |              | 
 width           | numeric(6,2)                |           |          |                                                | main     |             |              | 
 length          | numeric(6,2)                |           |          |                                                | main     |             |              | 
 board_type_id   | integer                     |           |          |                                                | plain    |             |              | 
 material_id     | integer                     |           |          |                                                | plain    |             |              | 
 special_part_id | integer                     |           |          |                                                | plain    |             |              | 
 quantity        | numeric(10,2)               |           |          | 1                                              | main     |             |              | 
 unit_price      | numeric(10,2)               |           |          |                                                | main     |             |              | 
 labor_price     | numeric(10,2)               |           |          |                                                | main     |             |              | 
 total_price     | numeric(10,2)               |           |          |                                                | main     |             |              | 
 notes           | text                        |           |          |                                                | extended |             |              | 
 created_at      | timestamp without time zone |           |          | CURRENT_TIMESTAMP                              | plain    |             |              | 
Indexes:
    "stair_config_items_pkey" PRIMARY KEY, btree (id)
    "idx_stair_config_items_config" btree (config_id)
    "idx_stair_config_items_type" btree (item_type)
Foreign-key constraints:
    "stair_config_items_board_type_id_fkey" FOREIGN KEY (board_type_id) REFERENCES stair_board_types(brd_typ_id)
    "stair_config_items_config_id_fkey" FOREIGN KEY (config_id) REFERENCES stair_configurations(id) ON DELETE CASCADE
    "stair_config_items_material_id_fkey" FOREIGN KEY (material_id) REFERENCES material_multipliers(material_id)
Access method: heap


## Deposit Management Tables

### deposits
Customer deposit tracking with payment details

                                                                      Table "public.deposits"
      Column      |            Type             | Collation | Nullable |               Default                | Storage  | Compression | Stats target | Description 
------------------+-----------------------------+-----------+----------+--------------------------------------+----------+-------------+--------------+-------------
 id               | integer                     |           | not null | nextval('deposits_id_seq'::regclass) | plain    |             |              | 
 customer_id      | integer                     |           | not null |                                      | plain    |             |              | 
 payment_method   | character varying(20)       |           | not null | 'check'::character varying           | extended |             |              | 
 reference_number | character varying(100)      |           |          |                                      | extended |             |              | 
 payment_date     | date                        |           |          |                                      | plain    |             |              | 
 total_amount     | numeric(10,2)               |           | not null |                                      | main     |             |              | 
 deposit_date     | timestamp without time zone |           |          | CURRENT_TIMESTAMP                    | plain    |             |              | 
 notes            | text                        |           |          |                                      | extended |             |              | 
 created_by       | integer                     |           |          |                                      | plain    |             |              | 
 created_at       | timestamp without time zone |           |          | CURRENT_TIMESTAMP                    | plain    |             |              | 
 updated_at       | timestamp without time zone |           |          | CURRENT_TIMESTAMP                    | plain    |             |              | 
Indexes:
    "deposits_pkey" PRIMARY KEY, btree (id)
    "idx_deposits_customer_check_number" UNIQUE, btree (customer_id, reference_number) WHERE payment_method::text = 'check'::text AND reference_number IS NOT NULL
    "idx_deposits_customer_id" btree (customer_id)
    "idx_deposits_deposit_date" btree (deposit_date)
    "idx_deposits_payment_method" btree (payment_method)
    "idx_deposits_reference_number" btree (reference_number)
Check constraints:
    "deposits_payment_method_check" CHECK (payment_method::text = ANY (ARRAY['check'::character varying, 'cash'::character varying, 'credit_card'::character varying, 'ach'::character varying, 'wire'::character varying, 'other'::character varying]::text[]))
    "deposits_total_amount_check" CHECK (total_amount > 0::numeric)
Foreign-key constraints:
    "deposits_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id)
    "deposits_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
Referenced by:
    TABLE "deposit_allocations" CONSTRAINT "deposit_allocations_deposit_id_fkey" FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE CASCADE
Access method: heap


### deposit_allocations
Allocation of deposits to specific jobs and items

                                                                      Table "public.deposit_allocations"
     Column      |            Type             | Collation | Nullable |                     Default                     | Storage  | Compression | Stats target | Description 
-----------------+-----------------------------+-----------+----------+-------------------------------------------------+----------+-------------+--------------+-------------
 id              | integer                     |           | not null | nextval('deposit_allocations_id_seq'::regclass) | plain    |             |              | 
 deposit_id      | integer                     |           | not null |                                                 | plain    |             |              | 
 job_id          | integer                     |           | not null |                                                 | plain    |             |              | 
 job_item_id     | integer                     |           | not null |                                                 | plain    |             |              | 
 amount          | numeric(10,2)               |           | not null |                                                 | main     |             |              | 
 allocation_date | timestamp without time zone |           |          | CURRENT_TIMESTAMP                               | plain    |             |              | 
 notes           | text                        |           |          |                                                 | extended |             |              | 
 created_by      | integer                     |           | not null |                                                 | plain    |             |              | 
 created_at      | timestamp without time zone |           |          | CURRENT_TIMESTAMP                               | plain    |             |              | 
Indexes:
    "deposit_allocations_pkey" PRIMARY KEY, btree (id)
    "idx_deposit_allocations_deposit_id" btree (deposit_id)
    "idx_deposit_allocations_job_id" btree (job_id)
    "idx_deposit_allocations_job_item_id" btree (job_item_id)
Check constraints:
    "deposit_allocations_amount_check" CHECK (amount > 0::numeric)
Foreign-key constraints:
    "deposit_allocations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id)
    "deposit_allocations_deposit_id_fkey" FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE CASCADE
    "deposit_allocations_job_id_fkey" FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    "deposit_allocations_job_item_id_fkey" FOREIGN KEY (job_item_id) REFERENCES job_items(id) ON DELETE CASCADE
Triggers:
    check_allocation_total_trigger BEFORE INSERT OR UPDATE ON deposit_allocations FOR EACH ROW EXECUTE FUNCTION check_allocation_total()
    update_job_deposits_trigger AFTER INSERT OR DELETE OR UPDATE ON deposit_allocations FOR EACH ROW EXECUTE FUNCTION update_job_deposit_totals()
    validate_deposit_allocation_links_trigger BEFORE INSERT OR UPDATE ON deposit_allocations FOR EACH ROW EXECUTE FUNCTION validate_deposit_allocation_links()
Access method: heap


## Other Business Tables

### shops
Shop cut sheet management

                                                                     Table "public.shops"
     Column     |            Type             | Collation | Nullable |              Default              | Storage  | Compression | Stats target | Description 
----------------+-----------------------------+-----------+----------+-----------------------------------+----------+-------------+--------------+-------------
 id             | integer                     |           | not null | nextval('shops_id_seq'::regclass) | plain    |             |              | 
 job_item_id    | integer                     |           |          |                                   | plain    |             |              | 
 cut_sheets     | jsonb                       |           |          |                                   | extended |             |              | 
 notes          | text                        |           |          |                                   | extended |             |              | 
 created_at     | timestamp without time zone |           |          | CURRENT_TIMESTAMP                 | plain    |             |              | 
 updated_at     | timestamp without time zone |           |          | CURRENT_TIMESTAMP                 | plain    |             |              | 
 shop_number    | character varying(50)       |           |          |                                   | extended |             |              | 
 status         | character varying(50)       |           |          | 'generated'::character varying    | extended |             |              | 
 generated_date | timestamp without time zone |           |          | CURRENT_TIMESTAMP                 | plain    |             |              | 
Indexes:
    "shops_pkey" PRIMARY KEY, btree (id)
    "idx_shops_generated_date" btree (generated_date)
    "idx_shops_job_item_id" btree (job_item_id)
    "idx_shops_status" btree (status)
Check constraints:
    "shops_status_check" CHECK (status::text = ANY (ARRAY['generated'::character varying, 'in_progress'::character varying, 'completed'::character varying]::text[]))
Foreign-key constraints:
    "shops_job_item_id_fkey" FOREIGN KEY (job_item_id) REFERENCES job_items(id) ON DELETE CASCADE
Referenced by:
    TABLE "shop_jobs" CONSTRAINT "shop_jobs_shop_id_fkey" FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
Access method: heap


### tax_rates
State tax rate configuration

                                                                     Table "public.tax_rates"
     Column     |            Type             | Collation | Nullable |                Default                | Storage  | Compression | Stats target | Description 
----------------+-----------------------------+-----------+----------+---------------------------------------+----------+-------------+--------------+-------------
 id             | integer                     |           | not null | nextval('tax_rates_id_seq'::regclass) | plain    |             |              | 
 state_code     | character varying(2)        |           | not null |                                       | extended |             |              | 
 rate           | numeric(5,4)                |           | not null |                                       | main     |             |              | 
 effective_date | date                        |           | not null | CURRENT_DATE                          | plain    |             |              | 
 is_active      | boolean                     |           |          | true                                  | plain    |             |              | 
 created_at     | timestamp without time zone |           |          | CURRENT_TIMESTAMP                     | plain    |             |              | 
 updated_at     | timestamp without time zone |           |          | CURRENT_TIMESTAMP                     | plain    |             |              | 
Indexes:
    "tax_rates_pkey" PRIMARY KEY, btree (id)
Check constraints:
    "tax_rates_rate_check" CHECK (rate >= 0::numeric)
Access method: heap


## Database Views

### deposits_with_balance
View showing deposits with calculated unallocated amounts

                                    View "public.deposits_with_balance"
       Column       |            Type             | Collation | Nullable | Default | Storage  | Description 
--------------------+-----------------------------+-----------+----------+---------+----------+-------------
 id                 | integer                     |           |          |         | plain    | 
 customer_id        | integer                     |           |          |         | plain    | 
 payment_method     | character varying(20)       |           |          |         | extended | 
 reference_number   | character varying(100)      |           |          |         | extended | 
 payment_date       | date                        |           |          |         | plain    | 
 total_amount       | numeric(10,2)               |           |          |         | main     | 
 deposit_date       | timestamp without time zone |           |          |         | plain    | 
 notes              | text                        |           |          |         | extended | 
 created_by         | integer                     |           |          |         | plain    | 
 created_at         | timestamp without time zone |           |          |         | plain    | 
 updated_at         | timestamp without time zone |           |          |         | plain    | 
 unallocated_amount | numeric                     |           |          |         | main     | 
View definition:
 SELECT d.id,
    d.customer_id,
    d.payment_method,
    d.reference_number,
    d.payment_date,
    d.total_amount,
    d.deposit_date,
    d.notes,
    d.created_by,
    d.created_at,
    d.updated_at,
    d.total_amount - COALESCE(sum(da.amount), 0::numeric) AS unallocated_amount
   FROM deposits d
     LEFT JOIN deposit_allocations da ON da.deposit_id = d.id
  GROUP BY d.id;


## Database Functions

                                                                                                                                                                                                                                                                                                                          List of functions
 Schema |             Name             |                                                                          Result data type                                                                          |                                                                 Argument data types                                                                 | Type | Volatility | Parallel |     Owner      | Security | Access privileges | Language |                                                                 Source code                                                                  |                       Description                       
--------+------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+------+------------+----------+----------------+----------+-------------------+----------+----------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------
 public | calculate_stair_price_simple | TABLE(base_price numeric, length_charge numeric, width_charge numeric, material_multiplier numeric, mitre_charge numeric, unit_price numeric, total_price numeric) | p_board_type_id integer, p_material_id integer, p_length numeric, p_width numeric, p_quantity integer DEFAULT 1, p_full_mitre boolean DEFAULT false | func | volatile   | unsafe   | craftmart_user | invoker  |                   | plpgsql  |                                                                                                                                             +| Current stair pricing function using simplified formula
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          | DECLARE                                                                                                                                     +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     v_pricing RECORD;                                                                                                                       +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     v_material RECORD;                                                                                                                      +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     v_base NUMERIC := 0;                                                                                                                    +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     v_length_extra NUMERIC := 0;                                                                                                            +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     v_width_extra NUMERIC := 0;                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     v_mitre NUMERIC := 0;                                                                                                                   +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     v_multiplier NUMERIC := 1.0;                                                                                                            +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     v_unit NUMERIC := 0;                                                                                                                    +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     v_total NUMERIC := 0;                                                                                                                   +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          | BEGIN                                                                                                                                       +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     -- Get pricing rule                                                                                                                     +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     SELECT * INTO v_pricing                                                                                                                 +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     FROM stair_pricing_simple                                                                                                               +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     WHERE board_type_id = p_board_type_id                                                                                                   +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |       AND is_active = true                                                                                                                  +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     LIMIT 1;                                                                                                                                +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |                                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     -- Get material multiplier                                                                                                              +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     SELECT * INTO v_material                                                                                                                +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     FROM material_multipliers                                                                                                               +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     WHERE material_id = p_material_id                                                                                                       +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |       AND is_active = true                                                                                                                  +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     LIMIT 1;                                                                                                                                +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |                                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     IF v_pricing.id IS NOT NULL THEN                                                                                                        +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         v_base := v_pricing.base_price;                                                                                                     +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         v_multiplier := COALESCE(v_material.multiplier, 1.0);                                                                               +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |                                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         -- Calculate length increment charge (per increment over base length)                                                               +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         IF p_length > v_pricing.base_length AND v_pricing.length_increment_price > 0 THEN                                                   +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |             v_length_extra := CEIL((p_length - v_pricing.base_length) / v_pricing.length_increment_size) * v_pricing.length_increment_price;+| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         END IF;                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |                                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         -- Calculate width increment charge (per increment over base width)                                                                 +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         IF p_width > v_pricing.base_width AND v_pricing.width_increment_price > 0 THEN                                                      +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |             v_width_extra := CEIL((p_width - v_pricing.base_width) / v_pricing.width_increment_size) * v_pricing.width_increment_price;     +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         END IF;                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |                                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         -- Calculate mitre charge                                                                                                           +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         IF p_full_mitre AND v_pricing.mitre_price > 0 THEN                                                                                  +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |             v_mitre := v_pricing.mitre_price;                                                                                               +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         END IF;                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |                                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         -- Calculate unit price: (Base + Length + Width) × Material + Mitre                                                                 +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         v_unit := (v_base + v_length_extra + v_width_extra) * v_multiplier + v_mitre;                                                       +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         v_total := v_unit * p_quantity;                                                                                                     +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     END IF;                                                                                                                                 +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |                                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |     RETURN QUERY SELECT                                                                                                                     +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         v_base,                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         v_length_extra,                                                                                                                     +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         v_width_extra,                                                                                                                      +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         v_multiplier,                                                                                                                       +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         v_mitre,                                                                                                                            +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         v_unit,                                                                                                                             +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |         v_total;                                                                                                                            +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          | END;                                                                                                                                        +| 
        |                              |                                                                                                                                                                    |                                                                                                                                                     |      |            |          |                |          |                   |          |                                                                                                                                              | 
(1 row)

                                                                                                                              List of functions
 Schema |           Name            | Result data type | Argument data types | Type | Volatility | Parallel |     Owner      | Security | Access privileges | Language |                                      Source code                                      | Description 
--------+---------------------------+------------------+---------------------+------+------------+----------+----------------+----------+-------------------+----------+---------------------------------------------------------------------------------------+-------------
 public | update_job_deposit_totals | trigger          |                     | func | volatile   | unsafe   | craftmart_user | invoker  |                   | plpgsql  |                                                                                      +| 
        |                           |                  |                     |      |            |          |                |          |                   |          | DECLARE                                                                              +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   old_job_id INTEGER;                                                                +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   new_job_id INTEGER;                                                                +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   has_totals_column BOOLEAN;                                                         +| 
        |                           |                  |                     |      |            |          |                |          |                   |          | BEGIN                                                                                +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   SELECT EXISTS (                                                                    +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     SELECT 1                                                                         +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     FROM information_schema.columns                                                  +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     WHERE table_name = 'jobs' AND column_name = 'total_deposits'                     +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   ) INTO has_totals_column;                                                          +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |                                                                                      +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   IF NOT has_totals_column THEN                                                      +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     RETURN COALESCE(NEW, OLD);                                                       +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   END IF;                                                                            +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |                                                                                      +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   IF TG_OP = 'UPDATE' THEN                                                           +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     old_job_id := OLD.job_id;                                                        +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     new_job_id := NEW.job_id;                                                        +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   ELSIF TG_OP = 'INSERT' THEN                                                        +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     old_job_id := NULL;                                                              +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     new_job_id := NEW.job_id;                                                        +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   ELSIF TG_OP = 'DELETE' THEN                                                        +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     old_job_id := OLD.job_id;                                                        +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     new_job_id := NULL;                                                              +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   END IF;                                                                            +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |                                                                                      +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   IF old_job_id IS NOT NULL THEN                                                     +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     UPDATE jobs                                                                      +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     SET total_deposits = (                                                           +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |       SELECT COALESCE(SUM(amount), 0)                                                +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |       FROM deposit_allocations                                                       +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |       WHERE job_id = old_job_id                                                      +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     )                                                                                +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     WHERE id = old_job_id;                                                           +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   END IF;                                                                            +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |                                                                                      +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   IF new_job_id IS NOT NULL AND (old_job_id IS NULL OR new_job_id <> old_job_id) THEN+| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     UPDATE jobs                                                                      +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     SET total_deposits = (                                                           +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |       SELECT COALESCE(SUM(amount), 0)                                                +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |       FROM deposit_allocations                                                       +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |       WHERE job_id = new_job_id                                                      +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     )                                                                                +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |     WHERE id = new_job_id;                                                           +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   END IF;                                                                            +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |                                                                                      +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |   RETURN COALESCE(NEW, OLD);                                                         +| 
        |                           |                  |                     |      |            |          |                |          |                   |          | END;                                                                                 +| 
        |                           |                  |                     |      |            |          |                |          |                   |          |                                                                                       | 
(1 row)

                                                                                                                        List of functions
 Schema |          Name          | Result data type | Argument data types | Type | Volatility | Parallel |     Owner      | Security | Access privileges | Language |                                 Source code                                  | Description 
--------+------------------------+------------------+---------------------+------+------------+----------+----------------+----------+-------------------+----------+------------------------------------------------------------------------------+-------------
 public | check_allocation_total | trigger          |                     | func | volatile   | unsafe   | craftmart_user | invoker  |                   | plpgsql  |                                                                             +| 
        |                        |                  |                     |      |            |          |                |          |                   |          | DECLARE                                                                     +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   total_allocated DECIMAL(10,2);                                            +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   deposit_amount DECIMAL(10,2);                                             +| 
        |                        |                  |                     |      |            |          |                |          |                   |          | BEGIN                                                                       +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   SELECT total_amount INTO deposit_amount                                   +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   FROM deposits                                                             +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   WHERE id = NEW.deposit_id                                                 +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   FOR UPDATE;                                                               +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |                                                                             +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   IF deposit_amount IS NULL THEN                                            +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |     RAISE EXCEPTION 'Deposit % not found', NEW.deposit_id                   +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |       USING ERRCODE = '23503';                                              +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   END IF;                                                                   +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |                                                                             +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   SELECT COALESCE(SUM(amount), 0) INTO total_allocated                      +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   FROM deposit_allocations                                                  +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   WHERE deposit_id = NEW.deposit_id                                         +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |     AND (TG_OP <> 'UPDATE' OR id <> NEW.id);                                +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |                                                                             +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   IF total_allocated + NEW.amount > deposit_amount THEN                     +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |     RAISE EXCEPTION 'Total allocations (%) would exceed deposit amount (%)',+| 
        |                        |                  |                     |      |            |          |                |          |                   |          |       total_allocated + NEW.amount, deposit_amount                          +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |       USING ERRCODE = '23514';                                              +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   END IF;                                                                   +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |                                                                             +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |   RETURN NEW;                                                               +| 
        |                        |                  |                     |      |            |          |                |          |                   |          | END;                                                                        +| 
        |                        |                  |                     |      |            |          |                |          |                   |          |                                                                              | 
(1 row)

                                                                                                                                  List of functions
 Schema |               Name                | Result data type | Argument data types | Type | Volatility | Parallel |     Owner      | Security | Access privileges | Language |                                      Source code                                       | Description 
--------+-----------------------------------+------------------+---------------------+------+------------+----------+----------------+----------+-------------------+----------+----------------------------------------------------------------------------------------+-------------
 public | validate_deposit_allocation_links | trigger          |                     | func | volatile   | unsafe   | craftmart_user | invoker  |                   | plpgsql  |                                                                                       +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          | DECLARE                                                                               +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |   item_job_id INTEGER;                                                                +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          | BEGIN                                                                                 +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |   SELECT job_id INTO item_job_id FROM job_items WHERE id = NEW.job_item_id;           +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |                                                                                       +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |   IF item_job_id IS NULL THEN                                                         +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |     RAISE EXCEPTION 'Job item % does not exist', NEW.job_item_id                      +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |       USING ERRCODE = '23514';                                                        +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |   END IF;                                                                             +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |                                                                                       +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |   IF item_job_id <> NEW.job_id THEN                                                   +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |     RAISE EXCEPTION 'Job item % does not belong to job %', NEW.job_item_id, NEW.job_id+| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |       USING ERRCODE = '23514';                                                        +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |   END IF;                                                                             +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |                                                                                       +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |   RETURN NEW;                                                                         +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          | END;                                                                                  +| 
        |                                   |                  |                     |      |            |          |                |          |                   |          |                                                                                        | 
(1 row)

## Database Indexes

 schema |       table_name       |               index_name               |                                                                                                definition                                                                                                 
--------+------------------------+----------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 public | customers              | customers_pkey                         | CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id)
 public | customers              | idx_customers_email                    | CREATE INDEX idx_customers_email ON public.customers USING btree (email)
 public | customers              | idx_customers_last_visited             | CREATE INDEX idx_customers_last_visited ON public.customers USING btree (last_visited_at DESC)
 public | deposit_allocations    | deposit_allocations_pkey               | CREATE UNIQUE INDEX deposit_allocations_pkey ON public.deposit_allocations USING btree (id)
 public | deposit_allocations    | idx_deposit_allocations_deposit_id     | CREATE INDEX idx_deposit_allocations_deposit_id ON public.deposit_allocations USING btree (deposit_id)
 public | deposit_allocations    | idx_deposit_allocations_job_id         | CREATE INDEX idx_deposit_allocations_job_id ON public.deposit_allocations USING btree (job_id)
 public | deposit_allocations    | idx_deposit_allocations_job_item_id    | CREATE INDEX idx_deposit_allocations_job_item_id ON public.deposit_allocations USING btree (job_item_id)
 public | deposits               | deposits_pkey                          | CREATE UNIQUE INDEX deposits_pkey ON public.deposits USING btree (id)
 public | deposits               | idx_deposits_customer_check_number     | CREATE UNIQUE INDEX idx_deposits_customer_check_number ON public.deposits USING btree (customer_id, reference_number) WHERE (((payment_method)::text = 'check'::text) AND (reference_number IS NOT NULL))
 public | deposits               | idx_deposits_customer_id               | CREATE INDEX idx_deposits_customer_id ON public.deposits USING btree (customer_id)
 public | deposits               | idx_deposits_deposit_date              | CREATE INDEX idx_deposits_deposit_date ON public.deposits USING btree (deposit_date)
 public | deposits               | idx_deposits_payment_method            | CREATE INDEX idx_deposits_payment_method ON public.deposits USING btree (payment_method)
 public | deposits               | idx_deposits_reference_number          | CREATE INDEX idx_deposits_reference_number ON public.deposits USING btree (reference_number)
 public | handrail_products      | handrail_products_pkey                 | CREATE UNIQUE INDEX handrail_products_pkey ON public.handrail_products USING btree (id)
 public | handrail_products      | handrail_products_product_id_key       | CREATE UNIQUE INDEX handrail_products_product_id_key ON public.handrail_products USING btree (product_id)
 public | handrail_products      | idx_handrail_products_product_id       | CREATE INDEX idx_handrail_products_product_id ON public.handrail_products USING btree (product_id)
 public | job_items              | idx_job_items_created_at               | CREATE INDEX idx_job_items_created_at ON public.job_items USING btree (created_at DESC)
 public | job_items              | idx_job_items_customer_id              | CREATE INDEX idx_job_items_customer_id ON public.job_items USING btree (customer_id)
 public | job_items              | idx_job_items_delivery_date            | CREATE INDEX idx_job_items_delivery_date ON public.job_items USING btree (delivery_date)
 public | job_items              | idx_job_items_job_id                   | CREATE INDEX idx_job_items_job_id ON public.job_items USING btree (job_id)
 public | job_items              | idx_job_items_salesman_id              | CREATE INDEX idx_job_items_salesman_id ON public.job_items USING btree (salesman_id)
 public | job_items              | idx_job_items_status                   | CREATE INDEX idx_job_items_status ON public.job_items USING btree (status)
 public | job_items              | idx_jobs_shops_run                     | CREATE INDEX idx_jobs_shops_run ON public.job_items USING btree (shops_run)
 public | job_items              | idx_jobs_shops_run_status              | CREATE INDEX idx_jobs_shops_run_status ON public.job_items USING btree (status, shops_run)
 public | job_items              | jobs_pkey                              | CREATE UNIQUE INDEX jobs_pkey ON public.job_items USING btree (id)
 public | job_sections           | idx_job_sections_job_item_id           | CREATE INDEX idx_job_sections_job_item_id ON public.job_sections USING btree (job_item_id)
 public | job_sections           | job_sections_pkey                      | CREATE UNIQUE INDEX job_sections_pkey ON public.job_sections USING btree (id)
 public | jobs                   | idx_jobs_created_at                    | CREATE INDEX idx_jobs_created_at ON public.jobs USING btree (created_at DESC)
 public | jobs                   | idx_jobs_customer_id                   | CREATE INDEX idx_jobs_customer_id ON public.jobs USING btree (customer_id)
 public | jobs                   | projects_pkey                          | CREATE UNIQUE INDEX projects_pkey ON public.jobs USING btree (id)
 public | landing_tread_products | idx_landing_tread_products_product_id  | CREATE INDEX idx_landing_tread_products_product_id ON public.landing_tread_products USING btree (product_id)
 public | landing_tread_products | landing_tread_products_pkey            | CREATE UNIQUE INDEX landing_tread_products_pkey ON public.landing_tread_products USING btree (id)
 public | landing_tread_products | landing_tread_products_product_id_key  | CREATE UNIQUE INDEX landing_tread_products_product_id_key ON public.landing_tread_products USING btree (product_id)
 public | material_multipliers   | material_multipliers_pkey              | CREATE UNIQUE INDEX material_multipliers_pkey ON public.material_multipliers USING btree (material_id)
 public | materials              | idx_materials_active                   | CREATE INDEX idx_materials_active ON public.materials USING btree (is_active)
 public | materials              | materials_pkey                         | CREATE UNIQUE INDEX materials_pkey ON public.materials USING btree (id)
 public | products               | idx_products_active                    | CREATE INDEX idx_products_active ON public.products USING btree (is_active)
 public | products               | idx_products_type                      | CREATE INDEX idx_products_type ON public.products USING btree (product_type)
 public | products               | products_pkey                          | CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id)
 public | quote_items            | idx_quote_items_job_item_id            | CREATE INDEX idx_quote_items_job_item_id ON public.quote_items USING btree (job_item_id)
 public | quote_items            | idx_quote_items_material_id            | CREATE INDEX idx_quote_items_material_id ON public.quote_items USING btree (material_id)
 public | quote_items            | idx_quote_items_product_id             | CREATE INDEX idx_quote_items_product_id ON public.quote_items USING btree (product_id)
 public | quote_items            | idx_quote_items_stair_config           | CREATE INDEX idx_quote_items_stair_config ON public.quote_items USING btree (stair_config_id)
 public | quote_items            | quote_items_pkey                       | CREATE UNIQUE INDEX quote_items_pkey ON public.quote_items USING btree (id)
 public | rail_parts_products    | idx_rail_parts_products_product_id     | CREATE INDEX idx_rail_parts_products_product_id ON public.rail_parts_products USING btree (product_id)
 public | rail_parts_products    | rail_parts_products_pkey               | CREATE UNIQUE INDEX rail_parts_products_pkey ON public.rail_parts_products USING btree (id)
 public | rail_parts_products    | rail_parts_products_product_id_key     | CREATE UNIQUE INDEX rail_parts_products_product_id_key ON public.rail_parts_products USING btree (product_id)
 public | salesmen               | salesmen_pkey                          | CREATE UNIQUE INDEX salesmen_pkey ON public.salesmen USING btree (id)
 public | shop_jobs              | idx_shop_jobs_job_id                   | CREATE INDEX idx_shop_jobs_job_id ON public.shop_jobs USING btree (job_id)
 public | shop_jobs              | idx_shop_jobs_shop_id                  | CREATE INDEX idx_shop_jobs_shop_id ON public.shop_jobs USING btree (shop_id)
 public | shop_jobs              | shop_jobs_pkey                         | CREATE UNIQUE INDEX shop_jobs_pkey ON public.shop_jobs USING btree (id)
 public | shop_jobs              | shop_jobs_shop_id_job_id_key           | CREATE UNIQUE INDEX shop_jobs_shop_id_job_id_key ON public.shop_jobs USING btree (shop_id, job_id)
 public | shops                  | idx_shops_generated_date               | CREATE INDEX idx_shops_generated_date ON public.shops USING btree (generated_date)
 public | shops                  | idx_shops_job_item_id                  | CREATE INDEX idx_shops_job_item_id ON public.shops USING btree (job_item_id)
 public | shops                  | idx_shops_status                       | CREATE INDEX idx_shops_status ON public.shops USING btree (status)
 public | shops                  | shops_pkey                             | CREATE UNIQUE INDEX shops_pkey ON public.shops USING btree (id)
 public | stair_board_types      | idx_stair_board_types_active           | CREATE INDEX idx_stair_board_types_active ON public.stair_board_types USING btree (is_active)
 public | stair_board_types      | idx_stair_board_types_id               | CREATE INDEX idx_stair_board_types_id ON public.stair_board_types USING btree (brd_typ_id)
 public | stair_board_types      | stair_board_types_brd_typ_id_key       | CREATE UNIQUE INDEX stair_board_types_brd_typ_id_key ON public.stair_board_types USING btree (brd_typ_id)
 public | stair_board_types      | stair_board_types_pkey                 | CREATE UNIQUE INDEX stair_board_types_pkey ON public.stair_board_types USING btree (id)
 public | stair_config_items     | idx_stair_config_items_config          | CREATE INDEX idx_stair_config_items_config ON public.stair_config_items USING btree (config_id)
 public | stair_config_items     | idx_stair_config_items_type            | CREATE INDEX idx_stair_config_items_type ON public.stair_config_items USING btree (item_type)
 public | stair_config_items     | stair_config_items_pkey                | CREATE UNIQUE INDEX stair_config_items_pkey ON public.stair_config_items USING btree (id)
 public | stair_configurations   | idx_stair_config_rough_cut             | CREATE INDEX idx_stair_config_rough_cut ON public.stair_configurations USING btree (rough_cut_width)
 public | stair_configurations   | idx_stair_configurations_job_item_id   | CREATE INDEX idx_stair_configurations_job_item_id ON public.stair_configurations USING btree (job_item_id)
 public | stair_configurations   | stair_configurations_pkey              | CREATE UNIQUE INDEX stair_configurations_pkey ON public.stair_configurations USING btree (id)
 public | stair_pricing_simple   | stair_pricing_simple_board_type_id_key | CREATE UNIQUE INDEX stair_pricing_simple_board_type_id_key ON public.stair_pricing_simple USING btree (board_type_id)
 public | stair_pricing_simple   | stair_pricing_simple_pkey              | CREATE UNIQUE INDEX stair_pricing_simple_pkey ON public.stair_pricing_simple USING btree (id)
 public | stair_special_parts    | idx_stair_special_parts_active         | CREATE INDEX idx_stair_special_parts_active ON public.stair_special_parts USING btree (is_active)
 public | stair_special_parts    | idx_stair_special_parts_lookup         | CREATE INDEX idx_stair_special_parts_lookup ON public.stair_special_parts USING btree (stpart_id, mat_seq_n)
 public | stair_special_parts    | stair_special_parts_pkey               | CREATE UNIQUE INDEX stair_special_parts_pkey ON public.stair_special_parts USING btree (id)
 public | tax_rates              | tax_rates_pkey                         | CREATE UNIQUE INDEX tax_rates_pkey ON public.tax_rates USING btree (id)
 public | users                  | idx_users_email                        | CREATE INDEX idx_users_email ON public.users USING btree (email)
 public | users                  | idx_users_role                         | CREATE INDEX idx_users_role ON public.users USING btree (role)
 public | users                  | users_email_key                        | CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)
 public | users                  | users_pkey                             | CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)
(76 rows)


## Foreign Key Relationships

       from_table       |         from_column         |       to_table       |  to_column  |                    constraint_name                    
------------------------+-----------------------------+----------------------+-------------+-------------------------------------------------------
 deposit_allocations    | created_by                  | users                | id          | deposit_allocations_created_by_fkey
 deposit_allocations    | deposit_id                  | deposits             | id          | deposit_allocations_deposit_id_fkey
 deposit_allocations    | job_id                      | jobs                 | id          | deposit_allocations_job_id_fkey
 deposit_allocations    | job_item_id                 | job_items            | id          | deposit_allocations_job_item_id_fkey
 deposits               | created_by                  | users                | id          | deposits_created_by_fkey
 deposits               | customer_id                 | customers            | id          | deposits_customer_id_fkey
 handrail_products      | product_id                  | products             | id          | handrail_products_product_id_fkey
 job_items              | customer_id                 | customers            | id          | jobs_customer_id_fkey
 job_items              | job_id                      | jobs                 | id          | job_items_job_id_fkey
 job_items              | salesman_id                 | salesmen             | id          | jobs_salesman_id_fkey
 job_sections           | job_item_id                 | job_items            | id          | job_sections_job_item_id_fkey
 jobs                   | customer_id                 | customers            | id          | projects_customer_id_fkey
 landing_tread_products | product_id                  | products             | id          | landing_tread_products_product_id_fkey
 quote_items            | job_item_id                 | job_items            | id          | quote_items_job_item_id_fkey
 quote_items            | material_id                 | materials            | id          | quote_items_material_id_fkey
 quote_items            | product_id                  | products             | id          | quote_items_product_id_fkey
 quote_items            | section_id                  | job_sections         | id          | quote_items_section_id_fkey
 quote_items            | stair_config_id             | stair_configurations | id          | quote_items_stair_config_id_fkey
 rail_parts_products    | product_id                  | products             | id          | rail_parts_products_product_id_fkey
 shop_jobs              | job_id                      | job_items            | id          | shop_jobs_job_id_fkey
 shop_jobs              | shop_id                     | shops                | id          | shop_jobs_shop_id_fkey
 shops                  | job_item_id                 | job_items            | id          | shops_job_item_id_fkey
 stair_config_items     | board_type_id               | stair_board_types    | brd_typ_id  | stair_config_items_board_type_id_fkey
 stair_config_items     | config_id                   | stair_configurations | id          | stair_config_items_config_id_fkey
 stair_config_items     | material_id                 | material_multipliers | material_id | stair_config_items_material_id_fkey
 stair_configurations   | center_stringer_material_id | material_multipliers | material_id | stair_configurations_center_stringer_material_id_fkey
 stair_configurations   | job_item_id                 | job_items            | id          | stair_configurations_job_item_id_fkey
 stair_configurations   | left_stringer_material_id   | material_multipliers | material_id | stair_configurations_left_stringer_material_id_fkey
 stair_configurations   | right_stringer_material_id  | material_multipliers | material_id | stair_configurations_right_stringer_material_id_fkey
 stair_configurations   | riser_material_id           | material_multipliers | material_id | stair_configurations_riser_material_id_fkey
 stair_configurations   | stringer_material_id        | material_multipliers | material_id | stair_configurations_stringer_material_id_fkey
 stair_configurations   | tread_material_id           | material_multipliers | material_id | stair_configurations_tread_material_id_fkey
 stair_pricing_simple   | board_type_id               | stair_board_types    | brd_typ_id  | stair_pricing_simple_board_type_id_fkey
 stair_special_parts    | mat_seq_n                   | material_multipliers | material_id | stair_special_parts_mat_seq_n_fkey
(34 rows)

