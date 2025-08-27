import { Request, Response } from 'express';
import pool from '../config/database';

// Save stair configuration
export const createStairConfiguration = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      jobId,
      configName,
      floorToFloor,
      numRisers,
      treadMaterialId,
      riserMaterialId,
      treadSize,
      roughCutWidth,
      noseSize,
      stringerType,
      stringerMaterialId,
      numStringers,
      centerHorses,
      fullMitre,
      bracketType,
      subtotal,
      laborTotal,
      taxAmount,
      totalAmount,
      specialNotes,
      items = [],
      // Individual stringer configurations
      individualStringers
    } = req.body;

    // Insert main configuration
    // Log received data for debugging
    console.log('Creating stair configuration with items:', JSON.stringify(items, null, 2));
    console.log('Individual stringers:', JSON.stringify(individualStringers, null, 2));

    // Extract individual stringer data
    const leftStringer = individualStringers?.left;
    const rightStringer = individualStringers?.right;
    const centerStringer = individualStringers?.center;

    const configResult = await client.query(
      `INSERT INTO stair_configurations (
        job_id, config_name, floor_to_floor, num_risers,
        tread_material_id, riser_material_id, tread_size, rough_cut_width, nose_size,
        stringer_type, stringer_material_id, num_stringers, center_horses,
        full_mitre, bracket_type, subtotal, labor_total,
        tax_amount, total_amount, special_notes,
        left_stringer_width, left_stringer_thickness, left_stringer_material_id,
        right_stringer_width, right_stringer_thickness, right_stringer_material_id,
        center_stringer_width, center_stringer_thickness, center_stringer_material_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *`,
      [
        jobId, configName, floorToFloor, numRisers,
        treadMaterialId, riserMaterialId, treadSize, roughCutWidth, noseSize,
        stringerType, stringerMaterialId, numStringers, centerHorses,
        fullMitre, bracketType, subtotal, laborTotal,
        taxAmount, totalAmount, specialNotes,
        leftStringer?.width, leftStringer?.thickness, leftStringer?.materialId,
        rightStringer?.width, rightStringer?.thickness, rightStringer?.materialId,
        centerStringer?.width, centerStringer?.thickness, centerStringer?.materialId
      ]
    );

    const configId = configResult.rows[0].id;

    // Insert configuration items
    for (const item of items) {
      console.log(`Inserting item: type=${item.itemType}, riser=${item.riserNumber}, treadType=${item.treadType}, width=${item.stairWidth}`);
      await client.query(
        `INSERT INTO stair_config_items (
          config_id, item_type, riser_number, tread_type,
          width, length, board_type_id, material_id,
          special_part_id, quantity, unit_price, labor_price,
          total_price, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          configId, item.itemType, item.riserNumber, item.treadType,
          item.stairWidth, item.totalWidth || (roughCutWidth + noseSize), item.boardTypeId, item.materialId,
          item.specialPartId, item.quantity, item.unitPrice, item.laborPrice,
          item.totalPrice, item.notes
        ]
      );
    }

    // Note: Quote item creation is handled by the frontend ProductSelector component
    // This ensures consistent behavior and prevents duplicate items

    await client.query('COMMIT');
    res.status(201).json(configResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating stair configuration:', error);
    res.status(500).json({ error: 'Failed to create stair configuration' });
  } finally {
    client.release();
  }
};

// Get stair configuration by ID
export const getStairConfiguration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get main configuration
    const configResult = await pool.query(
      `SELECT c.*, 
        tm.material_name as tread_material_name,
        rm.material_name as riser_material_name,
        sm.material_name as stringer_material_name,
        lsm.material_name as left_stringer_material_name,
        rsm.material_name as right_stringer_material_name,
        csm.material_name as center_stringer_material_name
       FROM stair_configurations c
       LEFT JOIN material_multipliers tm ON c.tread_material_id = tm.material_id
       LEFT JOIN material_multipliers rm ON c.riser_material_id = rm.material_id
       LEFT JOIN material_multipliers sm ON c.stringer_material_id = sm.material_id
       LEFT JOIN material_multipliers lsm ON c.left_stringer_material_id = lsm.material_id
       LEFT JOIN material_multipliers rsm ON c.right_stringer_material_id = rsm.material_id
       LEFT JOIN material_multipliers csm ON c.center_stringer_material_id = csm.material_id
       WHERE c.id = $1`,
      [id]
    );

    if (configResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stair configuration not found' });
    }

    const configuration = configResult.rows[0];

    // Get configuration items
    const itemsResult = await pool.query(
      `SELECT ci.*, mm.material_name
       FROM stair_config_items ci
       LEFT JOIN material_multipliers mm ON ci.material_id = mm.material_id
       WHERE ci.config_id = $1
       ORDER BY ci.item_type, ci.riser_number`,
      [id]
    );

    configuration.items = itemsResult.rows;

    res.json(configuration);
  } catch (error) {
    console.error('Error fetching stair configuration:', error);
    res.status(500).json({ error: 'Failed to fetch stair configuration' });
  }
};

// Get all configurations for a job
export const getJobStairConfigurations = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const result = await pool.query(
      `SELECT c.*, 
        tm.material_name as tread_material_name,
        rm.material_name as riser_material_name
       FROM stair_configurations c
       LEFT JOIN material_multipliers tm ON c.tread_material_id = tm.material_id
       LEFT JOIN material_multipliers rm ON c.riser_material_id = rm.material_id
       WHERE c.job_id = $1
       ORDER BY c.created_at DESC`,
      [jobId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching job stair configurations:', error);
    res.status(500).json({ error: 'Failed to fetch job stair configurations' });
  }
};

// Delete stair configuration
export const deleteStairConfiguration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM stair_configurations WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stair configuration not found' });
    }

    res.json({ message: 'Stair configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting stair configuration:', error);
    res.status(500).json({ error: 'Failed to delete stair configuration' });
  }
};