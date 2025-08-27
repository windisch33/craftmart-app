import { Request, Response } from 'express';
import pool from '../config/database';

// Get all board types
export const getStairBoardTypes = async (req: Request, res: Response) => {
  try {
    // Join with simplified pricing to show current pricing rules
    // Exclude legacy pricing flags (pric_riser, pric_bxris, etc.)
    const result = await pool.query(
      `SELECT 
        bt.id,
        bt.brd_typ_id,
        bt.brdtyp_des,
        bt.purpose,
        sp.base_price,
        sp.length_increment_price,
        sp.width_increment_price,
        sp.mitre_price,
        sp.base_length,
        sp.base_width,
        sp.length_increment_size,
        sp.width_increment_size,
        bt.is_active
       FROM stair_board_types bt
       LEFT JOIN stair_pricing_simple sp ON bt.brd_typ_id = sp.board_type_id
       WHERE bt.is_active = true 
       ORDER BY bt.brd_typ_id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching board types with pricing:', error);
    res.status(500).json({ error: 'Failed to fetch board types with pricing' });
  }
};;

// Create board type
export const createBoardType = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { 
      brd_typ_id, 
      brdtyp_des, 
      purpose,
      base_price,
      length_increment_price,
      width_increment_price,
      mitre_price,
      base_length = 36,
      base_width = 9,
      length_increment_size = 6,
      width_increment_size = 1,
      is_active = true 
    } = req.body;
    
    await client.query('BEGIN');
    
    // Create board type
    const boardTypeResult = await client.query(
      `INSERT INTO stair_board_types (brd_typ_id, brdtyp_des, purpose, pric_riser, pric_bxris, pric_opris, pric_doris, is_active)
       VALUES ($1, $2, $3, false, false, false, false, $4) RETURNING *`,
      [brd_typ_id, brdtyp_des, purpose, is_active]
    );
    
    // Create or update simplified pricing
    if (base_price !== undefined && base_price >= 0) {
      await client.query(
        `INSERT INTO stair_pricing_simple (
          board_type_id, base_price, length_increment_price, width_increment_price,
          mitre_price, base_length, base_width, length_increment_size, width_increment_size, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (board_type_id) 
        DO UPDATE SET 
          base_price = EXCLUDED.base_price,
          length_increment_price = EXCLUDED.length_increment_price,
          width_increment_price = EXCLUDED.width_increment_price,
          mitre_price = EXCLUDED.mitre_price,
          base_length = EXCLUDED.base_length,
          base_width = EXCLUDED.base_width,
          length_increment_size = EXCLUDED.length_increment_size,
          width_increment_size = EXCLUDED.width_increment_size,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP`,
        [brd_typ_id, base_price, length_increment_price || 0, width_increment_price || 0,
         mitre_price || 0, base_length, base_width, length_increment_size, width_increment_size, is_active]
      );
    }
    
    await client.query('COMMIT');
    
    // Get the complete board type with pricing
    const result = await pool.query(
      `SELECT 
        bt.*,
        sp.base_price,
        sp.length_increment_price,
        sp.width_increment_price,
        sp.mitre_price,
        sp.base_length,
        sp.base_width,
        sp.length_increment_size,
        sp.width_increment_size
       FROM stair_board_types bt
       LEFT JOIN stair_pricing_simple sp ON bt.brd_typ_id = sp.board_type_id
       WHERE bt.id = $1`,
      [boardTypeResult.rows[0].id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating board type:', error);
    res.status(500).json({ error: 'Failed to create board type with pricing' });
  } finally {
    client.release();
  }
};

// Update board type
export const updateBoardType = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { 
      brd_typ_id, 
      brdtyp_des, 
      purpose,
      base_price,
      length_increment_price,
      width_increment_price,
      mitre_price,
      base_length,
      base_width,
      length_increment_size,
      width_increment_size,
      is_active 
    } = req.body;
    
    await client.query('BEGIN');
    
    // Update board type
    const boardTypeResult = await client.query(
      `UPDATE stair_board_types 
       SET brd_typ_id = COALESCE($1, brd_typ_id),
           brdtyp_des = COALESCE($2, brdtyp_des),
           purpose = COALESCE($3, purpose),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [brd_typ_id, brdtyp_des, purpose, is_active, id]
    );
    
    if (boardTypeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Board type not found' });
    }
    
    const boardType = boardTypeResult.rows[0];
    
    // Update simplified pricing if provided
    if (base_price !== undefined) {
      await client.query(
        `INSERT INTO stair_pricing_simple (
          board_type_id, base_price, length_increment_price, width_increment_price,
          mitre_price, base_length, base_width, length_increment_size, width_increment_size, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (board_type_id) 
        DO UPDATE SET 
          base_price = COALESCE($2, stair_pricing_simple.base_price),
          length_increment_price = COALESCE($3, stair_pricing_simple.length_increment_price),
          width_increment_price = COALESCE($4, stair_pricing_simple.width_increment_price),
          mitre_price = COALESCE($5, stair_pricing_simple.mitre_price),
          base_length = COALESCE($6, stair_pricing_simple.base_length),
          base_width = COALESCE($7, stair_pricing_simple.base_width),
          length_increment_size = COALESCE($8, stair_pricing_simple.length_increment_size),
          width_increment_size = COALESCE($9, stair_pricing_simple.width_increment_size),
          is_active = COALESCE($10, stair_pricing_simple.is_active),
          updated_at = CURRENT_TIMESTAMP`,
        [boardType.brd_typ_id, base_price, length_increment_price, width_increment_price,
         mitre_price, base_length, base_width, length_increment_size, width_increment_size, is_active]
      );
    }
    
    await client.query('COMMIT');
    
    // Get the complete board type with pricing
    const result = await pool.query(
      `SELECT 
        bt.*,
        sp.base_price,
        sp.length_increment_price,
        sp.width_increment_price,
        sp.mitre_price,
        sp.base_length,
        sp.base_width,
        sp.length_increment_size,
        sp.width_increment_size
       FROM stair_board_types bt
       LEFT JOIN stair_pricing_simple sp ON bt.brd_typ_id = sp.board_type_id
       WHERE bt.id = $1`,
      [id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating board type:', error);
    res.status(500).json({ error: 'Failed to update board type with pricing' });
  } finally {
    client.release();
  }
};

// Delete board type
export const deleteBoardType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting is_active to false
    const result = await pool.query(
      'UPDATE stair_board_types SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Board type not found' });
    }
    
    res.json({ message: 'Board type deleted successfully' });
  } catch (error) {
    console.error('Error deleting board type:', error);
    res.status(500).json({ error: 'Failed to delete board type' });
  }
};