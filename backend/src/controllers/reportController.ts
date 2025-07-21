import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

export const getSalesReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        j.id,
        j.title,
        c.name as customer_name,
        j.status,
        j.quote_amount,
        j.order_amount,
        j.invoice_amount,
        j.created_at
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
    `;
    
    const params: any[] = [];
    
    if (start_date && end_date) {
      query += ' WHERE j.created_at BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    }
    
    query += ' ORDER BY j.created_at DESC';
    
    const result = await pool.query(query, params);
    
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'quote' THEN quote_amount ELSE 0 END) as total_quotes,
        SUM(CASE WHEN status = 'order' THEN order_amount ELSE 0 END) as total_orders,
        SUM(CASE WHEN status = 'invoice' THEN invoice_amount ELSE 0 END) as total_invoices
      FROM jobs
      ${start_date && end_date ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
    `, params);
    
    res.json({
      jobs: result.rows,
      summary: summary.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const getTaxReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        j.id,
        j.title,
        c.name as customer_name,
        c.state,
        j.invoice_amount,
        j.invoice_amount * 0.08 as tax_amount,
        j.created_at
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      WHERE j.status = 'invoice'
    `;
    
    const params: any[] = [];
    
    if (start_date && end_date) {
      query += ' AND j.created_at BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    }
    
    query += ' ORDER BY j.created_at DESC';
    
    const result = await pool.query(query, params);
    
    const summary = await pool.query(`
      SELECT 
        SUM(j.invoice_amount) as total_sales,
        SUM(j.invoice_amount * 0.08) as total_tax
      FROM jobs j
      WHERE j.status = 'invoice'
      ${start_date && end_date ? 'AND j.created_at BETWEEN $1 AND $2' : ''}
    `, params);
    
    res.json({
      invoices: result.rows,
      summary: summary.rows[0]
    });
  } catch (error) {
    next(error);
  }
};