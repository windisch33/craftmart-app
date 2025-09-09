import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

// Get all projects with customer info and job count
export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.customer_id,
        p.name,
        p.created_at,
        p.updated_at,
        c.name as customer_name,
        c.city as customer_city,
        c.state as customer_state,
        COUNT(j.id) as job_count,
        COALESCE(SUM(j.total_amount), 0) as total_value
      FROM projects p
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN jobs j ON p.id = j.project_id
      GROUP BY p.id, c.name, c.city, c.state
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get project by ID with all its jobs
export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
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
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.city as customer_city,
        c.state as customer_state
      FROM projects p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `;
    
    const projectResult = await pool.query(projectQuery, [projectId]);
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get all jobs for this project
    const jobsQuery = `
      SELECT 
        j.*,
        c.name as customer_name,
        s.first_name as salesman_first_name,
        s.last_name as salesman_last_name
      FROM jobs j
      JOIN customers c ON j.customer_id = c.id
      LEFT JOIN salesmen s ON j.salesman_id = s.id
      WHERE j.project_id = $1
      ORDER BY j.created_at DESC
    `;
    
    const jobsResult = await pool.query(jobsQuery, [projectId]);

    const project = {
      ...projectResult.rows[0],
      jobs: jobsResult.rows
    };

    res.json(project);
  } catch (error) {
    next(error);
  }
};

// Create new project
export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer_id, name } = req.body;

    // Validate required fields
    if (!customer_id || !name) {
      return res.status(400).json({ error: 'Customer ID and name are required' });
    }

    // Verify customer exists
    const customerCheck = await pool.query(
      'SELECT id FROM customers WHERE id = $1',
      [customer_id]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    const query = `
      INSERT INTO projects (customer_id, name)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await pool.query(query, [customer_id, name.trim()]);
    
    // Return project with customer info
    const newProject = result.rows[0];
    const projectWithCustomer = await pool.query(`
      SELECT 
        p.*,
        c.name as customer_name,
        c.city as customer_city,
        c.state as customer_state
      FROM projects p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `, [newProject.id]);

    res.status(201).json(projectWithCustomer.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Update project (name only)
export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const query = `
      UPDATE projects 
      SET name = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [name.trim(), projectId]);

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
      FROM projects p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `, [projectId]);

    res.json(projectWithCustomer.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Delete project (only if no jobs exist)
export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Check if project has jobs
    const jobCheck = await pool.query(
      'SELECT COUNT(*) as job_count FROM jobs WHERE project_id = $1',
      [projectId]
    );

    const jobCount = parseInt(jobCheck.rows[0].job_count);
    if (jobCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete project with ${jobCount} existing job${jobCount === 1 ? '' : 's'}` 
      });
    }

    const query = 'DELETE FROM projects WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [projectId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};