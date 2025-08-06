import { Request, Response } from 'express';
import pool from '../config/database';

// Get all stair materials
export const getStairMaterials = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM stair_materials 
       WHERE is_active = true 
       ORDER BY matrl_nam`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stair materials:', error);
    res.status(500).json({ error: 'Failed to fetch stair materials' });
  }
};

// Get all board types
export const getStairBoardTypes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM stair_board_types 
       WHERE is_active = true 
       ORDER BY brd_typ_id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching board types:', error);
    res.status(500).json({ error: 'Failed to fetch board types' });
  }
};

// Get special parts
export const getStairSpecialParts = async (req: Request, res: Response) => {
  try {
    const { materialId } = req.query;
    
    let query = `
      SELECT sp.*, sm.matrl_nam, sm.multiplier 
      FROM stair_special_parts sp
      LEFT JOIN stair_materials sm ON sp.mat_seq_n = sm.mat_seq_n
      WHERE sp.is_active = true
    `;
    
    const params: any[] = [];
    if (materialId) {
      query += ` AND sp.mat_seq_n = $1`;
      params.push(materialId);
    }
    
    query += ` ORDER BY sp.stpar_desc, sm.matrl_nam`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching special parts:', error);
    res.status(500).json({ error: 'Failed to fetch special parts' });
  }
};

// Get pricing rules for validation
export const getStairPriceRules = async (req: Request, res: Response) => {
  try {
    const { boardTypeId, materialId } = req.query;
    
    let query = `
      SELECT bp.*, bt.brdtyp_des, sm.matrl_nam
      FROM stair_board_prices bp
      JOIN stair_board_types bt ON bp.brd_typ_id = bt.brd_typ_id
      JOIN stair_materials sm ON bp.mat_seq_n = sm.mat_seq_n
      WHERE bp.is_active = true
        AND CURRENT_DATE BETWEEN bp.begin_date AND bp.end_date
    `;
    
    const params: any[] = [];
    let paramCount = 0;
    
    if (boardTypeId) {
      paramCount++;
      query += ` AND bp.brd_typ_id = $${paramCount}`;
      params.push(boardTypeId);
    }
    
    if (materialId) {
      paramCount++;
      query += ` AND bp.mat_seq_n = $${paramCount}`;
      params.push(materialId);
    }
    
    query += ` ORDER BY bp.brd_typ_id, bp.mat_seq_n, bp.brdlen_min, bp.brdwid_min`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching price rules:', error);
    res.status(500).json({ error: 'Failed to fetch price rules' });
  }
};

// Calculate stair price
export const calculateStairPrice = async (req: Request, res: Response) => {
  try {
    const {
      floorToFloor,
      numRisers,
      treads,
      treadMaterialId,
      riserMaterialId,
      stringerType,
      stringerMaterialId,
      numStringers = 2,
      centerHorses = 0,
      fullMitre = false,
      specialParts = []
    } = req.body;

    // Calculate riser height
    const riserHeight = floorToFloor / numRisers;

    // Initialize price breakdown
    const breakdown = {
      treads: [] as any[],
      risers: [] as any[],
      stringers: [] as any[],
      specialParts: [] as any[],
      labor: [] as any[]
    };

    let subtotal = 0;
    let laborTotal = 0;

    // Calculate tread prices
    for (const tread of treads) {
      const { riserNumber, type, width, length } = tread;
      
      // Determine board type ID based on tread type
      let boardTypeId = 1; // Default to box tread
      if (type === 'open_left' || type === 'open_right') boardTypeId = 2;
      if (type === 'double_open') boardTypeId = 3;

      // Get pricing from database
      const priceResult = await pool.query(
        `SELECT * FROM calculate_stair_price($1, $2, $3, $4, $5, $6)`,
        [boardTypeId, treadMaterialId, length, width, 1, fullMitre]
      );

      if (priceResult.rows.length > 0) {
        const price = priceResult.rows[0];
        breakdown.treads.push({
          riserNumber,
          type,
          width,
          length,
          basePrice: parseFloat(price.base_price || 0),
          oversizedCharge: parseFloat(price.oversized_charge || 0),
          mitreCharge: parseFloat(price.mitre_charge || 0),
          totalPrice: parseFloat(price.total_price || 0)
        });
        subtotal += parseFloat(price.total_price || 0);
      }
    }

    // Calculate riser prices
    const riserResult = await pool.query(
      `SELECT * FROM stair_board_prices
       WHERE brd_typ_id = 4
         AND mat_seq_n = $1
         AND is_active = true
         AND CURRENT_DATE BETWEEN begin_date AND end_date
       LIMIT 1`,
      [riserMaterialId]
    );

    if (riserResult.rows.length > 0) {
      const riserPrice = parseFloat(riserResult.rows[0].unit_cost) * numRisers;
      breakdown.risers.push({
        quantity: numRisers,
        unitPrice: parseFloat(riserResult.rows[0].unit_cost),
        totalPrice: riserPrice
      });
      subtotal += riserPrice;
    }

    // Calculate stringer prices
    if (stringerType && stringerMaterialId) {
      const stringerResult = await pool.query(
        `SELECT * FROM stair_board_prices
         WHERE brd_typ_id = 5
           AND mat_seq_n = $1
           AND is_active = true
           AND CURRENT_DATE BETWEEN begin_date AND end_date
         LIMIT 1`,
        [stringerMaterialId]
      );

      if (stringerResult.rows.length > 0) {
        const stringerPrice = parseFloat(stringerResult.rows[0].unit_cost) * numRisers * numStringers;
        breakdown.stringers.push({
          type: stringerType,
          quantity: numStringers,
          risers: numRisers,
          unitPricePerRiser: parseFloat(stringerResult.rows[0].unit_cost),
          totalPrice: stringerPrice
        });
        subtotal += stringerPrice;
        
        // Add labor for stringers
        laborTotal += numRisers * numStringers * 10; // $10 labor per stringer per riser
      }
    }

    // Calculate center horse prices
    if (centerHorses > 0) {
      const centerHorsePrice = 5.00 * numRisers * centerHorses;
      breakdown.stringers.push({
        type: 'Center Horse',
        quantity: centerHorses,
        risers: numRisers,
        unitPricePerRiser: 5.00,
        totalPrice: centerHorsePrice
      });
      subtotal += centerHorsePrice;
    }

    // Calculate special parts prices
    for (const part of specialParts) {
      const partResult = await pool.query(
        `SELECT * FROM stair_special_parts
         WHERE stpart_id = $1
           AND mat_seq_n = $2
           AND is_active = true
         LIMIT 1`,
        [part.partId, part.materialId || treadMaterialId]
      );

      if (partResult.rows.length > 0) {
        const partData = partResult.rows[0];
        const partPrice = parseFloat(partData.unit_cost) * (part.quantity || 1);
        const partLabor = parseFloat(partData.labor_cost || 0) * (part.quantity || 1);
        
        breakdown.specialParts.push({
          description: partData.stpar_desc,
          quantity: part.quantity || 1,
          unitPrice: parseFloat(partData.unit_cost),
          laborCost: parseFloat(partData.labor_cost || 0),
          totalPrice: partPrice
        });
        
        subtotal += partPrice;
        laborTotal += partLabor;
      }
    }

    // Add general labor
    breakdown.labor.push({
      description: 'Installation Labor',
      totalPrice: laborTotal
    });

    // Calculate totals
    const taxRate = 0.06; // Default 6% tax, should be based on location
    const taxAmount = subtotal * taxRate;
    const total = subtotal + laborTotal + taxAmount;

    res.json({
      configuration: {
        floorToFloor,
        numRisers,
        riserHeight: riserHeight.toFixed(3),
        fullMitre
      },
      breakdown,
      subtotal: subtotal.toFixed(2),
      laborTotal: laborTotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2)
    });
  } catch (error) {
    console.error('Error calculating stair price:', error);
    res.status(500).json({ error: 'Failed to calculate stair price' });
  }
};

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
      items = []
    } = req.body;

    // Insert main configuration
    const configResult = await client.query(
      `INSERT INTO stair_configurations (
        job_id, config_name, floor_to_floor, num_risers,
        tread_material_id, riser_material_id, tread_size, nose_size,
        stringer_type, stringer_material_id, num_stringers, center_horses,
        full_mitre, bracket_type, subtotal, labor_total,
        tax_amount, total_amount, special_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        jobId, configName, floorToFloor, numRisers,
        treadMaterialId, riserMaterialId, treadSize, noseSize,
        stringerType, stringerMaterialId, numStringers, centerHorses,
        fullMitre, bracketType, subtotal, laborTotal,
        taxAmount, totalAmount, specialNotes
      ]
    );

    const configId = configResult.rows[0].id;

    // Insert configuration items
    for (const item of items) {
      await client.query(
        `INSERT INTO stair_config_items (
          config_id, item_type, riser_number, tread_type,
          width, length, board_type_id, material_id,
          special_part_id, quantity, unit_price, labor_price,
          total_price, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          configId, item.itemType, item.riserNumber, item.treadType,
          item.width, item.length, item.boardTypeId, item.materialId,
          item.specialPartId, item.quantity, item.unitPrice, item.laborPrice,
          item.totalPrice, item.notes
        ]
      );
    }

    // If jobId is provided, also add as a quote item
    if (jobId) {
      // Create a section for the stair if needed
      const sectionResult = await client.query(
        `INSERT INTO job_sections (job_id, name, display_order, description)
         VALUES ($1, 'Staircase', 
           (SELECT COALESCE(MAX(display_order), 0) + 1 FROM job_sections WHERE job_id = $1),
           'Custom staircase configuration')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [jobId]
      );

      if (sectionResult.rows.length > 0) {
        const sectionId = sectionResult.rows[0].id;
        
        // Add as quote item
        await client.query(
          `INSERT INTO quote_items (
            job_id, section_id, part_number, description,
            quantity, unit_price, is_taxable
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            jobId,
            sectionId,
            `STAIR-${configId}`,
            configName || 'Custom Staircase',
            1,
            totalAmount,
            true
          ]
        );
      }
    }

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
        tm.matrl_nam as tread_material_name,
        rm.matrl_nam as riser_material_name,
        sm.matrl_nam as stringer_material_name
       FROM stair_configurations c
       LEFT JOIN stair_materials tm ON c.tread_material_id = tm.mat_seq_n
       LEFT JOIN stair_materials rm ON c.riser_material_id = rm.mat_seq_n
       LEFT JOIN stair_materials sm ON c.stringer_material_id = sm.mat_seq_n
       WHERE c.id = $1`,
      [id]
    );

    if (configResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stair configuration not found' });
    }

    const configuration = configResult.rows[0];

    // Get configuration items
    const itemsResult = await pool.query(
      `SELECT ci.*, sm.matrl_nam as material_name
       FROM stair_config_items ci
       LEFT JOIN stair_materials sm ON ci.material_id = sm.mat_seq_n
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
        tm.matrl_nam as tread_material_name,
        rm.matrl_nam as riser_material_name
       FROM stair_configurations c
       LEFT JOIN stair_materials tm ON c.tread_material_id = tm.mat_seq_n
       LEFT JOIN stair_materials rm ON c.riser_material_id = rm.mat_seq_n
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