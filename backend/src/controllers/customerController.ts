import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

export const getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
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