import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

// Get all salesmen
export const getAllSalesmen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { active } = req.query;
    let query = 'SELECT * FROM salesmen';
    const queryParams: any[] = [];

    if (active === 'true') {
      query += ' WHERE is_active = true';
    } else if (active === 'false') {
      query += ' WHERE is_active = false';
    }

    query += ' ORDER BY first_name ASC, last_name ASC';

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get specific salesman by ID
export const getSalesmanById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM salesmen WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Salesman not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new salesman
export const createSalesman = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { first_name, last_name, email, phone, commission_rate, notes } = req.body;
    
    // Validation
    if (!first_name || !last_name) {
      return res.status(400).json({ 
        error: 'First name and last name are required' 
      });
    }

    if (commission_rate && (commission_rate < 0 || commission_rate > 100)) {
      return res.status(400).json({ 
        error: 'Commission rate must be between 0 and 100' 
      });
    }

    // Check for duplicate email if provided
    if (email) {
      const existingResult = await pool.query(
        'SELECT id FROM salesmen WHERE email = $1 AND is_active = true',
        [email]
      );
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Email address is already in use by another active salesman' 
        });
      }
    }
    
    const result = await pool.query(
      `INSERT INTO salesmen (first_name, last_name, email, phone, commission_rate, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [first_name, last_name, email, phone, commission_rate || 0, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Update salesman
export const updateSalesman = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, commission_rate, notes, is_active } = req.body;
    
    // Validation
    if (!first_name || !last_name) {
      return res.status(400).json({ 
        error: 'First name and last name are required' 
      });
    }

    if (commission_rate && (commission_rate < 0 || commission_rate > 100)) {
      return res.status(400).json({ 
        error: 'Commission rate must be between 0 and 100' 
      });
    }

    // Check for duplicate email if provided (excluding current salesman)
    if (email) {
      const existingResult = await pool.query(
        'SELECT id FROM salesmen WHERE email = $1 AND id != $2 AND is_active = true',
        [email, id]
      );
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Email address is already in use by another active salesman' 
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE salesmen SET 
        first_name = $1, last_name = $2, email = $3, phone = $4, 
        commission_rate = $5, notes = $6, is_active = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [first_name, last_name, email, phone, commission_rate || 0, notes, 
       is_active !== undefined ? is_active : true, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Salesman not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Delete salesman (soft delete by setting is_active to false)
export const deleteSalesman = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if salesman has associated jobs
    const jobsResult = await pool.query(
      'SELECT COUNT(*) as job_count FROM jobs WHERE salesman_id = $1',
      [id]
    );
    
    const jobCount = parseInt(jobsResult.rows[0].job_count);
    
    if (jobCount > 0) {
      // Soft delete if has associated jobs
      const result = await pool.query(
        'UPDATE salesmen SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Salesman not found' });
      }
      
      res.json({ 
        message: 'Salesman deactivated successfully', 
        note: `Salesman has ${jobCount} associated jobs and was deactivated rather than deleted` 
      });
    } else {
      // Hard delete if no associated jobs
      const result = await pool.query('DELETE FROM salesmen WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Salesman not found' });
      }
      
      res.json({ message: 'Salesman deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
};

// Search salesmen
export const searchSalesmen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query parameter "q" is required' });
    }
    
    const searchTerm = `%${q}%`;
    const result = await pool.query(
      `SELECT * FROM salesmen 
       WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1) 
       AND is_active = true
       ORDER BY first_name ASC, last_name ASC`,
      [searchTerm]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get salesman statistics
export const getSalesmanStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status = 'quote' THEN 1 END) as quotes,
        COUNT(CASE WHEN status = 'order' THEN 1 END) as orders,
        COUNT(CASE WHEN status = 'invoice' THEN 1 END) as invoices,
        COALESCE(SUM(total_amount), 0) as total_sales
       FROM jobs 
       WHERE salesman_id = $1`,
      [id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};