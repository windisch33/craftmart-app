import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

// Get all projects (stored in table "jobs") with customer info and job item count
export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      q,
      address,
      city,
      state,
      zip,
      customer_id
    } = (req.query || {}) as {
      q?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      customer_id?: number;
    };

    let query = `
      SELECT 
        p.id,
        p.customer_id,
        p.name,
        p.created_at,
        p.updated_at,
        p.address as address,
        to_jsonb(p)->>'unit_number' as unit_number,
        p.city as city,
        p.state as state,
        p.zip_code as zip_code,
        c.name as customer_name,
        c.city as customer_city,
        c.state as customer_state,
        COUNT(ji.id) as job_count,
        COALESCE(SUM(ji.total_amount), 0) as total_value
      FROM jobs p
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN job_items ji ON ji.job_id = p.id
    `;

    const params: any[] = [];
    const where: string[] = [];

    // General search across project and address fields
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      params.push(term);
      where.push(`(
        p.name ILIKE $${params.length} OR
        c.name ILIKE $${params.length} OR
        p.address ILIKE $${params.length} OR
        (to_jsonb(p)->>'unit_number') ILIKE $${params.length} OR
        p.city ILIKE $${params.length} OR
        p.state ILIKE $${params.length} OR
        p.zip_code ILIKE $${params.length}
      )`);
    }

    if (address && address.trim()) {
      params.push(`%${address.trim()}%`);
      where.push(`p.address ILIKE $${params.length}`);
    }

    if (city && city.trim()) {
      params.push(`%${city.trim()}%`);
      where.push(`p.city ILIKE $${params.length}`);
    }

    if (state && state.trim()) {
      params.push(state.trim().toUpperCase());
      where.push(`p.state = $${params.length}`);
    }

    if (zip && zip.trim()) {
      params.push(`%${zip.trim()}%`);
      where.push(`p.zip_code ILIKE $${params.length}`);
    }

    if (typeof customer_id === 'number' && Number.isFinite(customer_id)) {
      params.push(customer_id);
      where.push(`p.customer_id = $${params.length}`);
    }

    if (where.length > 0) {
      query += ` WHERE ${where.join(' AND ')}`;
    }

    query += ` GROUP BY p.id, c.name, c.city, c.state ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get project (row in table "jobs") by ID with all its job items
export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = Number((req.params as any).id);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    // Get project details
    const projectQuery = `
      SELECT 
        p.id,
        p.customer_id,
        p.name,
        p.created_at,
        p.updated_at,
        p.address as address,
        to_jsonb(p)->>'unit_number' as unit_number,
        p.city as city,
        p.state as state,
        p.zip_code as zip_code,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.city as customer_city,
        c.state as customer_state
      FROM jobs p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `;
    
    const projectResult = await pool.query(projectQuery, [projectId]);
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get all job items for this project
    const jobItemsQuery = `
      SELECT 
        ji.*,
        c.name as customer_name,
        s.first_name as salesman_first_name,
        s.last_name as salesman_last_name
      FROM job_items ji
      JOIN customers c ON ji.customer_id = c.id
      LEFT JOIN salesmen s ON ji.salesman_id = s.id
      WHERE ji.job_id = $1
      ORDER BY ji.created_at DESC
    `;
    
    const jobsResult = await pool.query(jobItemsQuery, [projectId]);

    const project = {
      ...projectResult.rows[0],
      jobs: jobsResult.rows
    };

    res.json(project);
  } catch (error: unknown) {
    next(error);
  }
};

// Create new project (row in table "jobs")
export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer_id, name, address = null, unit_number = null, city = null, state = null, zip_code = null } = req.body;

    const customerId = typeof customer_id === 'string'
      ? Number.parseInt(customer_id, 10)
      : Number(customer_id);
    const nameValue = typeof name === 'string' ? name.trim() : '';

    if (!Number.isInteger(customerId) || !nameValue) {
      return res.status(400).json({ error: 'Customer ID and name are required' });
    }

    // Verify customer exists
    const customerCheck = await pool.query(
      'SELECT id FROM customers WHERE id = $1',
      [customerId]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    const query = `
      INSERT INTO jobs (customer_id, name, address, unit_number, city, state, zip_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [customerId, nameValue, address, unit_number, city, state, zip_code]);
    
    // Return project with customer info
    const newProject = result.rows[0];
    const projectWithCustomer = await pool.query(`
      SELECT 
        p.*,
        c.name as customer_name,
        c.city as customer_city,
        c.state as customer_state
      FROM jobs p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `, [newProject.id]);

    res.status(201).json(projectWithCustomer.rows[0]);
  } catch (error: unknown) {
    next(error);
  }
};

// Update project (name only) in table "jobs"
export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = Number((req.params as any).id);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    const { name, address = undefined, unit_number = undefined, city = undefined, state = undefined, zip_code = undefined } = req.body as any;

    const updates: string[] = [];
    const values: any[] = [];

    if (typeof name === 'string' && name.trim()) {
      updates.push('name = $' + (values.length + 1));
      values.push(name.trim());
    }
    if (address !== undefined) {
      updates.push('address = $' + (values.length + 1));
      values.push(address);
    }
    if (unit_number !== undefined) {
      updates.push('unit_number = $' + (values.length + 1));
      values.push(unit_number);
    }
    if (city !== undefined) {
      updates.push('city = $' + (values.length + 1));
      values.push(city);
    }
    if (state !== undefined) {
      updates.push('state = $' + (values.length + 1));
      values.push(state);
    }
    if (zip_code !== undefined) {
      updates.push('zip_code = $' + (values.length + 1));
      values.push(zip_code);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(projectId);

    const query = `
      UPDATE jobs 
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Return project with customer info
    const projectWithCustomer = await pool.query(`
      SELECT 
        p.*,
        c.name as customer_name,
        c.city as customer_city,
        c.state as customer_state
      FROM jobs p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `, [projectId]);

    res.json(projectWithCustomer.rows[0]);
  } catch (error: unknown) {
    next(error);
  }
};

// Delete project (only if no job items exist)
export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = Number((req.params as any).id);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Check if project has job items
    const jobCheck = await pool.query(
      'SELECT COUNT(*) as job_count FROM job_items WHERE job_id = $1',
      [projectId]
    );

    const jobCount = parseInt(jobCheck.rows[0].job_count);
    if (jobCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete project with ${jobCount} existing job${jobCount === 1 ? '' : 's'}` 
      });
    }

    const query = 'DELETE FROM jobs WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [projectId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error: unknown) {
    next(error);
  }
};
