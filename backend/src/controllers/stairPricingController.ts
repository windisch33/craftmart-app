import { Request, Response } from 'express';
import pool from '../config/database';

// Get pricing rules for validation
export const getStairPriceRules = async (req: Request, res: Response) => {
  try {
    const { boardTypeId } = req.query as { boardTypeId?: string };

    // Use simplified pricing table; material multipliers are applied at calculation time
    let query = `
      SELECT 
        sp.id,
        sp.board_type_id AS brd_typ_id,
        bt.brdtyp_des,
        sp.base_price,
        sp.length_increment_price,
        sp.width_increment_price,
        sp.mitre_price,
        sp.base_length,
        sp.base_width,
        sp.length_increment_size,
        sp.width_increment_size,
        sp.is_active
      FROM stair_pricing_simple sp
      LEFT JOIN stair_board_types bt ON bt.brd_typ_id = sp.board_type_id
      WHERE sp.is_active = true
    `;

    const params: any[] = [];
    if (boardTypeId) {
      params.push(boardTypeId);
      query += ` AND sp.board_type_id = $${params.length}`;
    }

    query += ` ORDER BY sp.board_type_id`;
    console.log('[PRICE_RULES] Query:', query, 'Params:', params);
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
      jobId,
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
        const basePrice = parseFloat(price.base_price || 0);
        const lengthCharge = parseFloat(price.length_charge || 0);
        const widthCharge = parseFloat(price.width_charge || 0);
        const mitreCharge = parseFloat(price.mitre_charge || 0);
        const unitPrice = parseFloat(price.unit_price || 0);
        const totalPrice = parseFloat(price.total_price || 0);
        breakdown.treads.push({
          riserNumber,
          type,
          stairWidth,
          basePrice,
          lengthCharge,
          widthCharge,
          oversizedCharge: lengthCharge + widthCharge,
          materialMultiplier: parseFloat(price.material_multiplier || 1),
          mitreCharge,
          unitPrice,
          totalPrice
        } as any);
        subtotal += totalPrice;
      }
    }

    // Calculate landing tread price only if requested
    if (includeLandingTread) {
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
        const basePrice = parseFloat(price.base_price || 0);
        const lengthCharge = parseFloat(price.length_charge || 0);
        const widthCharge = parseFloat(price.width_charge || 0);
        const mitreCharge = parseFloat(price.mitre_charge || 0);
        const unitPrice = parseFloat(price.unit_price || 0);
        const totalPrice = parseFloat(price.total_price || 0);
        breakdown.landingTread = {
          riserNumber: numRisers,
          type: 'box',
          width: landingTreadWidth,
          stairWidth: landingStairWidth,
          basePrice,
          lengthCharge,
          widthCharge,
          oversizedCharge: lengthCharge + widthCharge,
          materialMultiplier: parseFloat(price.material_multiplier || 1),
          mitreCharge,
          unitPrice,
          totalPrice
        } as any;
        subtotal += totalPrice;
      } else {
        console.error('Failed to calculate landing tread price - no matching price rule found');
      }
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
      console.log('[STAIR_CALC] Using INDIVIDUAL stringers logic');
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
      console.log('[STAIR_CALC] Using LEGACY stringer calculation for material:', stringerMaterialId);
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
          unitPricePerRiser: parseFloat(price.unit_price || 0),
          totalPrice: parseFloat(price.total_price || 0)
        });
        subtotal += parseFloat(price.total_price || 0);
      }
    }

    // Calculate center horse prices (dimension-based pricing, board type 6)
    if (centerHorses > 0 && !(individualStringers && individualStringers.center)) {
      // Center horses typically use same dimensions as stringers
      let horseThickness = 2; // Default 2" thick
      let horseWidth = 9.25; // Default 9.25" wide
      const horseMatch = stringerType?.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
      if (horseMatch) {
        horseThickness = parseFloat(horseMatch[1]) * 2; // Center horses are typically double thickness
        horseWidth = parseFloat(horseMatch[2]);
      }
      
      const centerMaterialId = (stringerMaterialId ?? treadMaterialId ?? 20);
      const centerHorseResult = await pool.query(
        `SELECT * FROM calculate_stair_price_simple($1, $2, $3, $4, $5, $6)`,
        [6, centerMaterialId, horseThickness, horseWidth, numRisers * centerHorses, false]
      );
      
      if (centerHorseResult.rows.length > 0) {
        const price = centerHorseResult.rows[0];
        breakdown.stringers.push({
          type: 'Center Horse',
          quantity: centerHorses,
          risers: numRisers,
          unitPricePerRiser: parseFloat(price.unit_price || 0),
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
    // Resolve tax rate: prefer job's tax_rate when provided
    let taxRate = 0.06;
    if (jobId) {
      try {
        const taxRes = await pool.query('SELECT tax_rate FROM jobs WHERE id = $1', [jobId]);
        const tr = taxRes.rows?.[0]?.tax_rate;
        if (tr !== undefined && tr !== null) {
          const parsed = parseFloat(tr);
          if (!Number.isNaN(parsed)) taxRate = parsed;
        }
      } catch (e) {
        console.warn('[STAIR_CALC] Failed to resolve job tax_rate for jobId', jobId, e);
      }
    }
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
