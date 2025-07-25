import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

export const getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recent } = req.query;
    
    let query: string;
    let params: any[] = [];
    
    if (recent === 'true') {
      // Get last 10 visited customers
      query = `
        SELECT * FROM customers 
        WHERE last_visited_at IS NOT NULL 
        ORDER BY last_visited_at DESC 
        LIMIT 10
      `;
    } else {
      // Default to all customers ordered by name
      query = 'SELECT * FROM customers ORDER BY name ASC';
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Update last_visited_at timestamp
    await pool.query(
      'UPDATE customers SET last_visited_at = NOW() WHERE id = $1',
      [id]
    );
    
    // Get the updated customer data
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address, city, state, zip_code, phone, mobile, fax, email, accounting_email, notes } = req.body;
    
    const result = await pool.query(
      `INSERT INTO customers (name, address, city, state, zip_code, phone, mobile, fax, email, accounting_email, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, address, city, state, zip_code, phone, mobile, fax, email, accounting_email, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, zip_code, phone, mobile, fax, email, accounting_email, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE customers SET name = $1, address = $2, city = $3, state = $4, zip_code = $5, 
       phone = $6, mobile = $7, fax = $8, email = $9, accounting_email = $10, notes = $11, updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [name, address, city, state, zip_code, phone, mobile, fax, email, accounting_email, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const searchCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.json([]);
    }
    
    const searchTerm = q.trim();
    const query = `
      SELECT * FROM customers 
      WHERE 
        name ILIKE $1 OR
        email ILIKE $1 OR
        city ILIKE $1 OR
        state ILIKE $1
      ORDER BY 
        CASE 
          WHEN name ILIKE $2 THEN 1
          WHEN name ILIKE $1 THEN 2
          ELSE 3
        END,
        name ASC
      LIMIT 50
    `;
    
    const result = await pool.query(query, [`%${searchTerm}%`, `${searchTerm}%`]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};