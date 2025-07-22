import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

// Get all products with optional type filtering
export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT p.*, 
             hp.cost_per_6_inches, 
             hp.labor_install_cost
      FROM products p
      LEFT JOIN handrail_products hp ON p.id = hp.product_id
      WHERE p.is_active = true
    `;
    const queryParams: any[] = [];
    
    if (type) {
      query += ' AND p.product_type = $1';
      queryParams.push(type);
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get specific product by ID
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, 
             hp.cost_per_6_inches, 
             hp.labor_install_cost
      FROM products p
      LEFT JOIN handrail_products hp ON p.id = hp.product_id
      WHERE p.id = $1 AND p.is_active = true
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create handrail product
export const createHandrailProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, cost_per_6_inches, labor_install_cost } = req.body;
    
    // Validation
    if (!name || !cost_per_6_inches || labor_install_cost === undefined) {
      return res.status(400).json({ 
        error: 'Name, cost_per_6_inches, and labor_install_cost are required' 
      });
    }
    
    if (cost_per_6_inches < 0 || labor_install_cost < 0) {
      return res.status(400).json({ 
        error: 'Cost and labor values must be non-negative' 
      });
    }
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create base product
      const productResult = await client.query(
        'INSERT INTO products (name, product_type) VALUES ($1, $2) RETURNING *',
        [name, 'handrail']
      );
      
      const productId = productResult.rows[0].id;
      
      // Create handrail-specific data
      const handrailResult = await client.query(
        'INSERT INTO handrail_products (product_id, cost_per_6_inches, labor_install_cost) VALUES ($1, $2, $3) RETURNING *',
        [productId, cost_per_6_inches, labor_install_cost]
      );
      
      await client.query('COMMIT');
      
      // Return combined data
      const result = {
        ...productResult.rows[0],
        cost_per_6_inches: handrailResult.rows[0].cost_per_6_inches,
        labor_install_cost: handrailResult.rows[0].labor_install_cost
      };
      
      res.status(201).json(result);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// Update handrail product
export const updateHandrailProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, cost_per_6_inches, labor_install_cost } = req.body;
    
    // Validation
    if (!name || !cost_per_6_inches || labor_install_cost === undefined) {
      return res.status(400).json({ 
        error: 'Name, cost_per_6_inches, and labor_install_cost are required' 
      });
    }
    
    if (cost_per_6_inches < 0 || labor_install_cost < 0) {
      return res.status(400).json({ 
        error: 'Cost and labor values must be non-negative' 
      });
    }
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update base product
      const productResult = await client.query(
        'UPDATE products SET name = $1, updated_at = NOW() WHERE id = $2 AND product_type = $3 RETURNING *',
        [name, id, 'handrail']
      );
      
      if (productResult.rows.length === 0) {
        return res.status(404).json({ error: 'Handrail product not found' });
      }
      
      // Update handrail-specific data
      const handrailResult = await client.query(
        'UPDATE handrail_products SET cost_per_6_inches = $1, labor_install_cost = $2 WHERE product_id = $3 RETURNING *',
        [cost_per_6_inches, labor_install_cost, id]
      );
      
      await client.query('COMMIT');
      
      // Return combined data
      const result = {
        ...productResult.rows[0],
        cost_per_6_inches: handrailResult.rows[0].cost_per_6_inches,
        labor_install_cost: handrailResult.rows[0].labor_install_cost
      };
      
      res.json(result);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// Delete product (soft delete by setting is_active to false)
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};