import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

export const getAllShops = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(`
      SELECT s.*, j.title as job_title, c.name as customer_name 
      FROM shops s 
      LEFT JOIN jobs j ON s.job_id = j.id 
      LEFT JOIN customers c ON j.customer_id = c.id 
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getShopById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*, j.title as job_title, c.name as customer_name 
      FROM shops s 
      LEFT JOIN jobs j ON s.job_id = j.id 
      LEFT JOIN customers c ON j.customer_id = c.id 
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const createShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { job_id, cut_sheets, notes } = req.body;
    
    const result = await pool.query(
      `INSERT INTO shops (job_id, cut_sheets, notes) 
       VALUES ($1, $2, $3) RETURNING *`,
      [job_id, JSON.stringify(cut_sheets), notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { job_id, cut_sheets, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE shops SET job_id = $1, cut_sheets = $2, notes = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [job_id, JSON.stringify(cut_sheets), notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM shops WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    next(error);
  }
};