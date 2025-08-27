import { Request, Response } from 'express';
import pool from '../config/database';

// Get special parts
export const getStairSpecialParts = async (req: Request, res: Response) => {
  try {
    const { materialId } = req.query;
    
    let query = `
      SELECT sp.*, mm.material_name as matrl_nam, mm.multiplier 
      FROM stair_special_parts sp
      LEFT JOIN material_multipliers mm ON sp.mat_seq_n = mm.material_id
      WHERE sp.is_active = true
    `;
    
    const params: any[] = [];
    if (materialId) {
      query += ` AND sp.mat_seq_n = $1`;
      params.push(materialId);
    }
    
    query += ` ORDER BY sp.stpar_desc, mm.material_name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching special parts:', error);
    res.status(500).json({ error: 'Failed to fetch special parts' });
  }
};

// Create special part
export const createSpecialPart = async (req: Request, res: Response) => {
  try {
    const { stpart_id, stpar_desc, mat_seq_n, position, unit_cost, labor_cost = 0, is_active = true } = req.body;
    
    const result = await pool.query(
      `INSERT INTO stair_special_parts (stpart_id, stpar_desc, mat_seq_n, position, unit_cost, labor_cost, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [stpart_id, stpar_desc, mat_seq_n, position, unit_cost, labor_cost, is_active]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating special part:', error);
    res.status(500).json({ error: 'Failed to create special part' });
  }
};

// Update special part
export const updateSpecialPart = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stpart_id, stpar_desc, mat_seq_n, position, unit_cost, labor_cost, is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE stair_special_parts 
       SET stpart_id = COALESCE($1, stpart_id),
           stpar_desc = COALESCE($2, stpar_desc),
           mat_seq_n = COALESCE($3, mat_seq_n),
           position = COALESCE($4, position),
           unit_cost = COALESCE($5, unit_cost),
           labor_cost = COALESCE($6, labor_cost),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [stpart_id, stpar_desc, mat_seq_n, position, unit_cost, labor_cost, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Special part not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating special part:', error);
    res.status(500).json({ error: 'Failed to update special part' });
  }
};

// Delete special part
export const deleteSpecialPart = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting is_active to false
    const result = await pool.query(
      'UPDATE stair_special_parts SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Special part not found' });
    }
    
    res.json({ message: 'Special part deleted successfully' });
  } catch (error) {
    console.error('Error deleting special part:', error);
    res.status(500).json({ error: 'Failed to delete special part' });
  }
};