import { Request, Response } from 'express';
import pool from '../config/database';

// Get all stair materials
export const getStairMaterials = async (req: Request, res: Response) => {
  try {
    // Now using the simplified material_multipliers table
    const result = await pool.query(
      `SELECT 
        material_id as id,
        material_id as mat_seq_n,
        material_name as matrl_nam,
        multiplier,
        CASE 
          WHEN multiplier = 1.0 THEN 'Base material'
          WHEN multiplier < 1.0 THEN CONCAT(ROUND((1 - multiplier) * 100)::text, '% discount')
          ELSE CONCAT(ROUND((multiplier - 1) * 100)::text, '% premium')
        END as description,
        display_order,
        is_active
       FROM material_multipliers 
       WHERE is_active = true 
       ORDER BY display_order, material_name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching material multipliers:', error);
    res.status(500).json({ error: 'Failed to fetch material multipliers' });
  }
};;

// Create stair material
export const createStairMaterial = async (req: Request, res: Response) => {
  try {
    const { material_name, multiplier, display_order, is_active = true } = req.body;
    
    // Generate next material_id
    const idResult = await pool.query(
      'SELECT COALESCE(MAX(material_id), 0) + 1 as next_id FROM material_multipliers'
    );
    const nextId = idResult.rows[0].next_id;
    
    const result = await pool.query(
      `INSERT INTO material_multipliers (material_id, material_name, multiplier, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nextId, material_name, multiplier || 1.0, display_order || nextId, is_active]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating material multiplier:', error);
    res.status(500).json({ error: 'Failed to create material multiplier' });
  }
};

// Update stair material
export const updateStairMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { material_name, multiplier, display_order, is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE material_multipliers 
       SET material_name = COALESCE($1, material_name),
           multiplier = COALESCE($2, multiplier),
           display_order = COALESCE($3, display_order),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE material_id = $5 RETURNING *`,
      [material_name, multiplier, display_order, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material multiplier not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating material multiplier:', error);
    res.status(500).json({ error: 'Failed to update material multiplier' });
  }
};

// Delete stair material
export const deleteStairMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting is_active to false
    const result = await pool.query(
      'UPDATE material_multipliers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE material_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material multiplier not found' });
    }
    
    res.json({ message: 'Material multiplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting material multiplier:', error);
    res.status(500).json({ error: 'Failed to delete material multiplier' });
  }
};