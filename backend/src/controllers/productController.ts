import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

// Get all products with optional type filtering
export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT p.*, 
             hp.cost_per_6_inches as handrail_cost_per_6_inches, 
             ltp.cost_per_6_inches as landing_tread_cost_per_6_inches,
             ltp.labor_install_cost as landing_tread_labor_cost,
             rpp.base_price as rail_parts_base_price,
             rpp.labor_install_cost as rail_parts_labor_cost,
             COALESCE(hp.cost_per_6_inches, ltp.cost_per_6_inches) as cost_per_6_inches,
             COALESCE(ltp.labor_install_cost, rpp.labor_install_cost) as labor_install_cost,
             rpp.base_price
      FROM products p
      LEFT JOIN handrail_products hp ON p.id = hp.product_id AND p.product_type = 'handrail'
      LEFT JOIN landing_tread_products ltp ON p.id = ltp.product_id AND p.product_type = 'landing_tread'
      LEFT JOIN rail_parts_products rpp ON p.id = rpp.product_id AND p.product_type = 'rail_parts'
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
             hp.cost_per_6_inches as handrail_cost_per_6_inches, 
             ltp.cost_per_6_inches as landing_tread_cost_per_6_inches,
             ltp.labor_install_cost as landing_tread_labor_cost,
             rpp.base_price as rail_parts_base_price,
             rpp.labor_install_cost as rail_parts_labor_cost,
             COALESCE(hp.cost_per_6_inches, ltp.cost_per_6_inches) as cost_per_6_inches,
             COALESCE(ltp.labor_install_cost, rpp.labor_install_cost) as labor_install_cost,
             rpp.base_price
      FROM products p
      LEFT JOIN handrail_products hp ON p.id = hp.product_id AND p.product_type = 'handrail'
      LEFT JOIN landing_tread_products ltp ON p.id = ltp.product_id AND p.product_type = 'landing_tread'
      LEFT JOIN rail_parts_products rpp ON p.id = rpp.product_id AND p.product_type = 'rail_parts'
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
    const { name, cost_per_6_inches } = req.body;
    
    // Validation
    const validName = typeof name === 'string' && name.trim().length > 0;
    const costNum = Number(cost_per_6_inches);
    const hasCost = Number.isFinite(costNum);

    if (!validName || !hasCost) {
      return res.status(400).json({ 
        error: 'Name and cost_per_6_inches are required' 
      });
    }
    
    if (costNum < 0) {
      return res.status(400).json({ 
        error: 'Cost must be non-negative' 
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
        'INSERT INTO handrail_products (product_id, cost_per_6_inches) VALUES ($1, $2) RETURNING *',
        [productId, costNum]
      );
      
      await client.query('COMMIT');
      
      // Return combined data
      const result = {
        ...productResult.rows[0],
        cost_per_6_inches: handrailResult.rows[0].cost_per_6_inches
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
    const { name, cost_per_6_inches } = req.body;
    
    // Validation
    const validName = typeof name === 'string' && name.trim().length > 0;
    const costNum = Number(cost_per_6_inches);
    const hasCost = Number.isFinite(costNum);

    if (!validName || !hasCost) {
      return res.status(400).json({ 
        error: 'Name and cost_per_6_inches are required' 
      });
    }
    
    if (costNum < 0) {
      return res.status(400).json({ 
        error: 'Cost must be non-negative' 
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
        'UPDATE handrail_products SET cost_per_6_inches = $1 WHERE product_id = $2 RETURNING *',
        [costNum, id]
      );
      
      await client.query('COMMIT');
      
      // Return combined data
      const result = {
        ...productResult.rows[0],
        cost_per_6_inches: handrailResult.rows[0].cost_per_6_inches
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
// Get landing tread products
export const getLandingTreadProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             ltp.cost_per_6_inches, 
             ltp.labor_install_cost
      FROM products p
      INNER JOIN landing_tread_products ltp ON p.id = ltp.product_id
      WHERE p.is_active = true AND p.product_type = 'landing_tread'
      ORDER BY p.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Create landing tread product
export const createLandingTreadProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, cost_per_6_inches, labor_install_cost } = req.body;
    
    // Validation
    const validName = typeof name === 'string' && name.trim().length > 0;
    const costNum = Number(cost_per_6_inches);
    const laborNum = Number(labor_install_cost);
    const hasCost = Number.isFinite(costNum);
    const hasLabor = Number.isFinite(laborNum);

    if (!validName || !hasCost || !hasLabor) {
      return res.status(400).json({ 
        error: 'Name, cost_per_6_inches, and labor_install_cost are required' 
      });
    }
    
    if (costNum < 0 || laborNum < 0) {
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
        [name, 'landing_tread']
      );
      
      const productId = productResult.rows[0].id;
      
      // Create landing tread-specific data
      const landingTreadResult = await client.query(
        'INSERT INTO landing_tread_products (product_id, cost_per_6_inches, labor_install_cost) VALUES ($1, $2, $3) RETURNING *',
        [productId, costNum, laborNum]
      );
      
      await client.query('COMMIT');
      
      // Return combined data
      const result = {
        ...productResult.rows[0],
        cost_per_6_inches: landingTreadResult.rows[0].cost_per_6_inches,
        labor_install_cost: landingTreadResult.rows[0].labor_install_cost
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

// Update landing tread product
export const updateLandingTreadProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, cost_per_6_inches, labor_install_cost } = req.body;
    
    // Validation
    const validName = typeof name === 'string' && name.trim().length > 0;
    const costNum = Number(cost_per_6_inches);
    const laborNum = Number(labor_install_cost);
    const hasCost = Number.isFinite(costNum);
    const hasLabor = Number.isFinite(laborNum);

    if (!validName || !hasCost || !hasLabor) {
      return res.status(400).json({ 
        error: 'Name, cost_per_6_inches, and labor_install_cost are required' 
      });
    }
    
    if (costNum < 0 || laborNum < 0) {
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
        [name, id, 'landing_tread']
      );
      
      if (productResult.rows.length === 0) {
        return res.status(404).json({ error: 'Landing tread product not found' });
      }
      
      // Update landing tread-specific data
      const landingTreadResult = await client.query(
        'UPDATE landing_tread_products SET cost_per_6_inches = $1, labor_install_cost = $2 WHERE product_id = $3 RETURNING *',
        [costNum, laborNum, id]
      );
      
      await client.query('COMMIT');
      
      // Return combined data
      const result = {
        ...productResult.rows[0],
        cost_per_6_inches: landingTreadResult.rows[0].cost_per_6_inches,
        labor_install_cost: landingTreadResult.rows[0].labor_install_cost
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
// Get rail parts products
export const getRailPartsProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             rpp.base_price, 
             rpp.labor_install_cost
      FROM products p
      INNER JOIN rail_parts_products rpp ON p.id = rpp.product_id
      WHERE p.is_active = true AND p.product_type = 'rail_parts'
      ORDER BY p.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Create rail parts product
export const createRailPartsProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, base_price, labor_install_cost } = req.body;
    
    // Validation
    const validName = typeof name === 'string' && name.trim().length > 0;
    const baseNum = Number(base_price);
    const laborNum = Number(labor_install_cost);
    const hasBase = Number.isFinite(baseNum);
    const hasLabor = Number.isFinite(laborNum);

    if (!validName || !hasBase || !hasLabor) {
      return res.status(400).json({ 
        error: 'Name, base_price, and labor_install_cost are required' 
      });
    }
    
    if (baseNum < 0 || laborNum < 0) {
      return res.status(400).json({ 
        error: 'Price and labor values must be non-negative' 
      });
    }
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create base product
      const productResult = await client.query(
        'INSERT INTO products (name, product_type) VALUES ($1, $2) RETURNING *',
        [name, 'rail_parts']
      );
      
      const productId = productResult.rows[0].id;
      
      // Create rail parts-specific data
      const railPartsResult = await client.query(
        'INSERT INTO rail_parts_products (product_id, base_price, labor_install_cost) VALUES ($1, $2, $3) RETURNING *',
        [productId, baseNum, laborNum]
      );
      
      await client.query('COMMIT');
      
      // Return combined data
      const result = {
        ...productResult.rows[0],
        base_price: railPartsResult.rows[0].base_price,
        labor_install_cost: railPartsResult.rows[0].labor_install_cost
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

// Update rail parts product
export const updateRailPartsProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, base_price, labor_install_cost } = req.body;
    
    // Validation
    const validName = typeof name === 'string' && name.trim().length > 0;
    const baseNum = Number(base_price);
    const laborNum = Number(labor_install_cost);
    const hasBase = Number.isFinite(baseNum);
    const hasLabor = Number.isFinite(laborNum);

    if (!validName || !hasBase || !hasLabor) {
      return res.status(400).json({ 
        error: 'Name, base_price, and labor_install_cost are required' 
      });
    }
    
    if (baseNum < 0 || laborNum < 0) {
      return res.status(400).json({ 
        error: 'Price and labor values must be non-negative' 
      });
    }
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update base product
      const productResult = await client.query(
        'UPDATE products SET name = $1, updated_at = NOW() WHERE id = $2 AND product_type = $3 RETURNING *',
        [name, id, 'rail_parts']
      );
      
      if (productResult.rows.length === 0) {
        return res.status(404).json({ error: 'Rail parts product not found' });
      }
      
      // Update rail parts-specific data
      const railPartsResult = await client.query(
        'UPDATE rail_parts_products SET base_price = $1, labor_install_cost = $2 WHERE product_id = $3 RETURNING *',
        [baseNum, laborNum, id]
      );
      
      await client.query('COMMIT');
      
      // Return combined data
      const result = {
        ...productResult.rows[0],
        base_price: railPartsResult.rows[0].base_price,
        labor_install_cost: railPartsResult.rows[0].labor_install_cost
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
