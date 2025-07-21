import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

export const getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(`
      SELECT j.*, c.name as customer_name 
      FROM jobs j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      ORDER BY j.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT j.*, c.name as customer_name 
      FROM jobs j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      WHERE j.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer_id, title, description, status, quote_amount, order_amount, invoice_amount } = req.body;
    
    const result = await pool.query(
      `INSERT INTO jobs (customer_id, title, description, status, quote_amount, order_amount, invoice_amount) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [customer_id, title, description, status, quote_amount, order_amount, invoice_amount]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { customer_id, title, description, status, quote_amount, order_amount, invoice_amount } = req.body;
    
    const result = await pool.query(
      `UPDATE jobs SET customer_id = $1, title = $2, description = $3, status = $4, 
       quote_amount = $5, order_amount = $6, invoice_amount = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [customer_id, title, description, status, quote_amount, order_amount, invoice_amount, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};