import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

const isDatabaseError = (error: unknown): error is { code?: string } => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

// Get all materials
export const getAllMaterials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      'SELECT * FROM materials WHERE is_active = true ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error: unknown) {
    next(error);
  }
};

// Get specific material by ID
export const getMaterialById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM materials WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new material
export const createMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, multiplier, description } = req.body;
    
    // Validation
    if (!name || !multiplier) {
      return res.status(400).json({ 
        error: 'Name and multiplier are required' 
      });
    }
    
    if (multiplier <= 0) {
      return res.status(400).json({ 
        error: 'Multiplier must be greater than 0' 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO materials (name, multiplier, description) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, multiplier, description || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    // Handle unique constraint violations
    if (isDatabaseError(error) && error.code === '23505') {
      return res.status(409).json({ error: 'Material with this name already exists' });
    }
    next(error);
  }
};

// Update material
export const updateMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, multiplier, description } = req.body;
    
    // Validation
    if (!name || !multiplier) {
      return res.status(400).json({ 
        error: 'Name and multiplier are required' 
      });
    }
    
    if (multiplier <= 0) {
      return res.status(400).json({ 
        error: 'Multiplier must be greater than 0' 
      });
    }
    
    const result = await pool.query(
      `UPDATE materials 
       SET name = $1, multiplier = $2, description = $3, updated_at = NOW()
       WHERE id = $4 AND is_active = true
       RETURNING *`,
      [name, multiplier, description || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: unknown) {
    // Handle unique constraint violations
    if (isDatabaseError(error) && error.code === '23505') {
      return res.status(409).json({ error: 'Material with this name already exists' });
    }
    next(error);
  }
};

// Delete material (soft delete by setting is_active to false)
export const deleteMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if material is being used in any quote items
    const usageCheck = await pool.query(
      'SELECT COUNT(*) FROM quote_items WHERE material_id = $1',
      [id]
    );
    
    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete material that is being used in quotes' 
      });
    }
    
    const result = await pool.query(
      'UPDATE materials SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json({ message: 'Material deleted successfully' });
  } catch (error: unknown) {
    next(error);
  }
};
