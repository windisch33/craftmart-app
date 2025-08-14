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
};;;

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
};;;

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
      roughCutWidth,
      noseSize = 1.25, // Default nose size if not provided
      stringerType,
      stringerMaterialId,
      numStringers = 2,
      centerHorses = 0,
      fullMitre = false,
      specialParts = [],
      includeLandingTread = false,
      individualStringers
    } = req.body;

    console.log('=== BACKEND CALCULATE PRICE START ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Received individualStringers:', JSON.stringify(individualStringers, null, 2));
    console.log('individualStringers type:', typeof individualStringers);
    console.log('individualStringers truthy?', !!individualStringers);
    console.log('Number of treads received:', treads?.length || 0);

    // Calculate riser height
    const riserHeight = floorToFloor / numRisers;

    // Initialize price breakdown
    const breakdown = {
      treads: [] as any[],
      landingTread: null as any,
      risers: [] as any[],
      stringers: [] as any[],
      specialParts: [] as any[],
      labor: [] as any[]
    };

    let subtotal = 0;
    let laborTotal = 0;

    // Calculate tread prices using new simplified function
    for (const tread of treads) {
      const { riserNumber, type, stairWidth } = tread;
      
      // Determine board type ID based on tread type
      let boardTypeId = 1; // Default to box tread
      if (type === 'open_left' || type === 'open_right') boardTypeId = 2;
      if (type === 'double_open') boardTypeId = 3;

      // Use simplified pricing function with total tread width (rough cut + nose)
      const totalTreadWidth = roughCutWidth + noseSize;
      const priceResult = await pool.query(
        `SELECT * FROM calculate_stair_price_simple($1, $2, $3, $4, $5, $6)`,
        [boardTypeId, treadMaterialId, stairWidth, totalTreadWidth, 1, fullMitre]
      );

      if (priceResult.rows.length > 0) {
        const price = priceResult.rows[0];
        breakdown.treads.push({
          riserNumber,
          type,
          stairWidth,
          basePrice: parseFloat(price.base_price || 0),
          lengthCharge: parseFloat(price.length_charge || 0),
          widthCharge: parseFloat(price.width_charge || 0),
          materialMultiplier: parseFloat(price.material_multiplier || 1),
          mitreCharge: parseFloat(price.mitre_charge || 0),
          unitPrice: parseFloat(price.unit_price || 0),
          totalPrice: parseFloat(price.total_price || 0)
        });
        subtotal += parseFloat(price.total_price || 0);
      }
    }

    // Calculate landing tread price (3.5" total width including nose, same material as regular treads)
    const landingTreadWidth = 3.5; // Fixed total width for landing tread (includes nose)
    const landingStairWidth = treads[0]?.stairWidth || 38; // Default to 38" if no treads configured
    
    console.log('Calculating landing tread:', {
      boardType: 1,
      material: treadMaterialId,
      length: landingStairWidth,
      width: landingTreadWidth,
      fullMitre
    });
    
    const landingTreadResult = await pool.query(
      `SELECT * FROM calculate_stair_price_simple($1, $2, $3, $4, $5, $6)`,
      [1, treadMaterialId, landingStairWidth, landingTreadWidth, 1, fullMitre]
    );

    if (landingTreadResult.rows.length > 0) {
      const price = landingTreadResult.rows[0];
      console.log('Landing tread price result:', price);
      breakdown.landingTread = {
        type: 'box',
        width: landingTreadWidth,
        stairWidth: landingStairWidth,
        basePrice: parseFloat(price.base_price || 0),
        lengthCharge: parseFloat(price.length_charge || 0),
        widthCharge: parseFloat(price.width_charge || 0),
        materialMultiplier: parseFloat(price.material_multiplier || 1),
        mitreCharge: parseFloat(price.mitre_charge || 0),
        unitPrice: parseFloat(price.unit_price || 0),
        totalPrice: parseFloat(price.total_price || 0)
      };
      subtotal += parseFloat(price.total_price || 0);
    } else {
      console.error('Failed to calculate landing tread price - no matching price rule found');
    }

    // Calculate riser prices by type - each tread type requires a corresponding riser
    const riserGroups = new Map<string, { type: string, width: number, count: number }>();

    console.log('Processing treads for riser calculation:', treads);

    // Group risers by tread type and width
    for (const tread of treads) {
      let riserType = 'standard';
      if (tread.type === 'open_left' || tread.type === 'open_right') {
        riserType = 'open';
      } else if (tread.type === 'double_open') {
        riserType = 'double_open';
      }

      const key = `${riserType}_${tread.stairWidth}`;
      if (riserGroups.has(key)) {
        riserGroups.get(key)!.count++;
      } else {
        riserGroups.set(key, {
          type: riserType,
          width: tread.stairWidth,
          count: 1
        });
      }
    }

    console.log('Riser groups created:', Array.from(riserGroups.entries()));

    // Add landing tread riser if applicable (standard type, uses first tread width or default)
    if (includeLandingTread) {
      const landingRiserWidth = treads[0]?.stairWidth || 38;
      const key = `standard_${landingRiserWidth}`;
      if (riserGroups.has(key)) {
        riserGroups.get(key)!.count++;
      } else {
        riserGroups.set(key, {
          type: 'standard',
          width: landingRiserWidth,
          count: 1
        });
      }
    }

    // Calculate pricing for each riser group
    for (const [key, group] of riserGroups) {
      console.log(`Calculating ${group.type} risers: ${group.count} @ ${group.width}" width`);
      
      const riserResult = await pool.query(
        `SELECT * FROM calculate_stair_price_simple($1, $2, $3, $4, $5, $6)`,
        [4, riserMaterialId, group.width, 8, group.count, false]
      );

      if (riserResult.rows.length > 0) {
        const price = riserResult.rows[0];
        breakdown.risers.push({
          type: group.type,
          width: group.width,
          quantity: group.count,
          basePrice: parseFloat(price.base_price || 0),
          lengthCharge: parseFloat(price.length_charge || 0),
          widthCharge: parseFloat(price.width_charge || 0),
          materialMultiplier: parseFloat(price.material_multiplier || 1),
          unitPrice: parseFloat(price.unit_price || 0),
          totalPrice: parseFloat(price.total_price || 0)
        });
        subtotal += parseFloat(price.total_price || 0);
      } else {
        console.error(`Failed to calculate ${group.type} riser pricing for width ${group.width}"`);
      }
    }

    // Calculate stringer prices - handle individual stringers if provided
    console.log('Checking individualStringers condition...');
    console.log('individualStringers exists?', !!individualStringers);
    console.log('individualStringers has left?', !!individualStringers?.left);
    console.log('individualStringers has right?', !!individualStringers?.right);
    
    if (individualStringers && (individualStringers.left || individualStringers.right)) {
      console.log('✅ Using INDIVIDUAL stringers logic');
      console.log('Calculating individual stringers:', individualStringers);

      // Process left stringer
      if (individualStringers.left) {
        const left = individualStringers.left;
        const stringerResult = await pool.query(
          `SELECT * FROM calculate_stair_price_simple($1, $2, $3, $4, $5, $6)`,
          [5, left.materialId, left.thickness, left.width, numRisers, false]
        );

        if (stringerResult.rows.length > 0) {
          const price = stringerResult.rows[0];
          breakdown.stringers.push({
            type: `Left: ${left.thickness}"×${left.width}"`,
            quantity: 1,
            risers: numRisers,
            width: left.width,
            thickness: left.thickness,
            basePrice: parseFloat(price.base_price || 0),
            widthCharge: parseFloat(price.width_charge || 0),
            thicknessCharge: parseFloat(price.length_charge || 0),
            materialMultiplier: parseFloat(price.material_multiplier || 1),
            unitPricePerRiser: parseFloat(price.unit_price || 0),
            totalPrice: parseFloat(price.total_price || 0)
          });
          subtotal += parseFloat(price.total_price || 0);
        }
      }

      // Process right stringer
      if (individualStringers.right) {
        const right = individualStringers.right;
        const stringerResult = await pool.query(
          `SELECT * FROM calculate_stair_price_simple($1, $2, $3, $4, $5, $6)`,
          [5, right.materialId, right.thickness, right.width, numRisers, false]
        );

        if (stringerResult.rows.length > 0) {
          const price = stringerResult.rows[0];
          breakdown.stringers.push({
            type: `Right: ${right.thickness}"×${right.width}"`,
            quantity: 1,
            risers: numRisers,
            width: right.width,
            thickness: right.thickness,
            basePrice: parseFloat(price.base_price || 0),
            widthCharge: parseFloat(price.width_charge || 0),
            thicknessCharge: parseFloat(price.length_charge || 0),
            materialMultiplier: parseFloat(price.material_multiplier || 1),
            unitPricePerRiser: parseFloat(price.unit_price || 0),
            totalPrice: parseFloat(price.total_price || 0)
          });
          subtotal += parseFloat(price.total_price || 0);
        }
      }

      // Process center stringer/horse if exists
      if (individualStringers.center) {
        const center = individualStringers.center;
        const stringerResult = await pool.query(
          `SELECT * FROM calculate_stair_price_simple($1, $2, $3, $4, $5, $6)`,
          [6, center.materialId, center.thickness, center.width, numRisers, false] // Board type 6 for center horse
        );

        if (stringerResult.rows.length > 0) {
          const price = stringerResult.rows[0];
          breakdown.stringers.push({
            type: `Center: ${center.thickness}"×${center.width}"`,
            quantity: 1,
            risers: numRisers,
            width: center.width,
            thickness: center.thickness,
            basePrice: parseFloat(price.base_price || 0),
            widthCharge: parseFloat(price.width_charge || 0),
            thicknessCharge: parseFloat(price.length_charge || 0),
            materialMultiplier: parseFloat(price.material_multiplier || 1),
            unitPricePerRiser: parseFloat(price.unit_price || 0),
            totalPrice: parseFloat(price.total_price || 0)
          });
          subtotal += parseFloat(price.total_price || 0);
        }
      }
    } else if (stringerType && stringerMaterialId) {
      // Fallback to legacy single stringer type
      console.log('⚠️ Using LEGACY stringer calculation for material:', stringerMaterialId);
      console.log('Legacy stringer type:', stringerType);
      
      let stringerThickness = 1;
      let stringerWidth = 9.25;
      const stringerMatch = stringerType.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
      if (stringerMatch) {
        stringerThickness = parseFloat(stringerMatch[1]);
        stringerWidth = parseFloat(stringerMatch[2]);
      }
      
      const stringerResult = await pool.query(
        `SELECT * FROM calculate_stair_price_simple($1, $2, $3, $4, $5, $6)`,
        [5, stringerMaterialId, stringerThickness, stringerWidth, numRisers * numStringers, false]
      );

      if (stringerResult.rows.length > 0) {
        const price = stringerResult.rows[0];
        breakdown.stringers.push({
          type: stringerType,
          quantity: numStringers,
          risers: numRisers,
          width: stringerWidth,
          thickness: stringerThickness,
          basePrice: parseFloat(price.base_price || 0),
          widthCharge: parseFloat(price.width_charge || 0),
          thicknessCharge: parseFloat(price.length_charge || 0),
          materialMultiplier: parseFloat(price.material_multiplier || 1),
          unitPricePerRiser: parseFloat(price.unit_price || 0) / numStringers,
          totalPrice: parseFloat(price.total_price || 0)
        });
        subtotal += parseFloat(price.total_price || 0);
      }
    }

    // Calculate center horse prices (dimension-based pricing, board type 6)
    if (centerHorses > 0) {
      // Center horses typically use same dimensions as stringers
      let horseThickness = 2; // Default 2" thick
      let horseWidth = 9.25; // Default 9.25" wide
      const horseMatch = stringerType?.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
      if (horseMatch) {
        horseThickness = parseFloat(horseMatch[1]) * 2; // Center horses are typically double thickness
        horseWidth = parseFloat(horseMatch[2]);
      }
      
      const centerHorseResult = await pool.query(
        `SELECT * FROM calculate_stair_price_simple($1, $2, $3, $4, $5, $6)`,
        [6, 20, horseThickness, horseWidth, numRisers * centerHorses, false] // Using Red Oak as default
      );
      
      if (centerHorseResult.rows.length > 0) {
        const price = centerHorseResult.rows[0];
        breakdown.stringers.push({
          type: 'Center Horse',
          quantity: centerHorses,
          risers: numRisers,
          unitPricePerRiser: 5.00,
          totalPrice: parseFloat(price.total_price || 0)
        });
        subtotal += parseFloat(price.total_price || 0);
      }
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

    console.log('=== BACKEND RESPONSE SUMMARY ===');
    console.log('Stringers in response:', breakdown.stringers?.length || 0);
    console.log('Risers in response:', breakdown.risers?.length || 0);
    console.log('Stringer types:', breakdown.stringers?.map(s => s.type) || []);
    console.log('Riser types:', breakdown.risers?.map(r => r.type) || []);

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
};;

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
      items = []
    } = req.body;

    // Insert main configuration
    const configResult = await client.query(
      `INSERT INTO stair_configurations (
        job_id, config_name, floor_to_floor, num_risers,
        tread_material_id, riser_material_id, tread_size, rough_cut_width, nose_size,
        stringer_type, stringer_material_id, num_stringers, center_horses,
        full_mitre, bracket_type, subtotal, labor_total,
        tax_amount, total_amount, special_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        jobId, configName, floorToFloor, numRisers,
        treadMaterialId, riserMaterialId, treadSize, roughCutWidth, noseSize,
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
        sm.material_name as stringer_material_name
       FROM stair_configurations c
       LEFT JOIN material_multipliers tm ON c.tread_material_id = tm.material_id
       LEFT JOIN material_multipliers rm ON c.riser_material_id = rm.material_id
       LEFT JOIN material_multipliers sm ON c.stringer_material_id = sm.material_id
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

// ============================================
// STAIR MATERIALS CRUD OPERATIONS
// ============================================

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

// ============================================
// BOARD TYPES CRUD OPERATIONS
// ============================================

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

// ============================================
// BOARD PRICING CRUD OPERATIONS
// ============================================

// Create board price
export const createBoardPrice = async (req: Request, res: Response) => {
  try {
    const { 
      brd_typ_id, 
      mat_seq_n,
      brdlen_min = 0,
      brdlen_max,
      brdwid_min = 0,
      brdwid_max,
      brdthk_min = 0,
      brdthk_max = 2,
      unit_cost,
      fulmit_cst = 0,
      len_incr = 1,
      len_cost = 0,
      wid_incr = 1,
      wid_cost = 0,
      begin_date,
      end_date = '2099-12-31',
      is_active = true
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO stair_board_prices (
        brd_typ_id, mat_seq_n, brdlen_min, brdlen_max, brdwid_min, brdwid_max, 
        brdthk_min, brdthk_max, unit_cost, fulmit_cst, len_incr, len_cost, 
        wid_incr, wid_cost, begin_date, end_date, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        brd_typ_id, mat_seq_n, brdlen_min, brdlen_max, brdwid_min, brdwid_max,
        brdthk_min, brdthk_max, unit_cost, fulmit_cst, len_incr, len_cost,
        wid_incr, wid_cost, begin_date, end_date, is_active
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating board price:', error);
    res.status(500).json({ error: 'Failed to create board price' });
  }
};

// Update board price
export const updateBoardPrice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && key !== 'id') {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `UPDATE stair_board_prices SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Board price not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating board price:', error);
    res.status(500).json({ error: 'Failed to update board price' });
  }
};

// Delete board price
export const deleteBoardPrice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting is_active to false
    const result = await pool.query(
      'UPDATE stair_board_prices SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Board price not found' });
    }
    
    res.json({ message: 'Board price deleted successfully' });
  } catch (error) {
    console.error('Error deleting board price:', error);
    res.status(500).json({ error: 'Failed to delete board price' });
  }
};

// ============================================
// SPECIAL PARTS CRUD OPERATIONS
// ============================================

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