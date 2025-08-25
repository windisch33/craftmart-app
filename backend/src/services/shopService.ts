import { Pool } from 'pg';
import pool from '../config/database';

// Types for shop data
interface StairConfiguration {
  id: number;
  job_id: number;
  config_name: string;
  floor_to_floor: number;
  num_risers: number;
  riser_height: number;
  tread_size: string;
  nose_size: number;
  stringer_type: string;
  num_stringers: number;
  center_horses: number;
  full_mitre: boolean;
}

interface StairConfigItem {
  id: number;
  config_id: number;
  item_type: string;
  riser_number?: number;
  tread_type?: string;
  width: number;
  length: number;
  board_type_id?: number;
  material_id?: number;
  quantity: number;
}

interface CutSheetItem {
  item_type: string; // 'tread', 'riser', 's4s'
  tread_type?: string; // 'box', 'open', 'double_open'
  material: string;
  quantity: number;
  width: number; // cut width
  length: number; // cut length
  thickness?: string;
  stair_id: string;
  location: string;
  notes?: string;
}

interface ShopData {
  id: number;
  shop_number: string;
  job_ids: number[];
  cut_sheets: CutSheetItem[];
  status: string;
  generated_date: string;
}

/**
 * Calculate cut dimensions for treads based on tread type
 * Based on formulas from Shops.txt:
 * - Box treads: width = rough_cut + nose, length = length - 1.25" (for routes)  
 * - Open treads: width = rough_cut + nose, length = length - 0.625" (for route)
 * - Double open treads: width = rough_cut + nose, length = length (no reduction)
 */
function calculateTreadDimensions(
  config: StairConfiguration,
  item: StairConfigItem,
  roughCutWidth: number = 11 // Standard rough cut width
): { width: number; length: number } {
  const width = roughCutWidth + (config.nose_size || 0);
  let length = item.length;

  switch (item.tread_type) {
    case 'box':
      length = item.length - 1.25; // Subtract for routes (0.625" each end)
      break;
    case 'open':
      length = item.length - 0.625; // Subtract for single route
      break;
    case 'double_open':
      // No reduction for double open
      break;
    default:
      // Default to box tread calculation
      length = item.length - 1.25;
      break;
  }

  return { width, length };
}

/**
 * Calculate cut dimensions for risers based on tread type
 * Based on formulas from Shops.txt:
 * - Box risers: width = riser_height, length = length - 1.25" (for routes)
 * - Open risers: width = riser_height, length = length - 1.875" (route + nose overhang)
 * - Double open risers: width = riser_height, length = length - 2.5" (nose overhangs)
 */
function calculateRiserDimensions(
  config: StairConfiguration,
  item: StairConfigItem,
  associatedTreadType: string = 'box'
): { width: number; length: number } {
  const width = config.riser_height;
  let length = item.length;

  switch (associatedTreadType) {
    case 'box':
      length = item.length - 1.25; // Subtract for routes
      break;
    case 'open':
      length = item.length - 1.875; // Route (0.625") + nose overhang (1.25")
      break;
    case 'double_open':
      length = item.length - 2.5; // Two nose overhangs (1.25" each)
      break;
    default:
      length = item.length - 1.25;
      break;
  }

  return { width, length };
}

/**
 * Calculate S4S (bottom riser) dimensions
 * Based on Shops.txt logic:
 * - Width = riser_height - 1"
 * - Length logic:
 *   - If has double open treads: use double open riser length
 *   - Else if has open ends: use open riser length  
 *   - Else: use box riser length
 */
function calculateS4SDimensions(
  config: StairConfiguration,
  configItems: StairConfigItem[]
): { width: number; length: number } {
  const width = config.riser_height - 1;

  // Determine S4S length based on tread types present
  const treadTypes = configItems
    .filter(item => item.item_type === 'tread')
    .map(item => item.tread_type)
    .filter(Boolean);

  const hasDoubleOpen = treadTypes.includes('double_open');
  const hasOpen = treadTypes.some(type => type?.includes('open'));

  // Use a sample riser length for calculation
  const sampleRiser = configItems.find(item => item.item_type === 'riser');
  const baseLength = sampleRiser?.length || config.floor_to_floor; // Fallback

  let length: number;
  if (hasDoubleOpen) {
    length = baseLength - 2.5; // Double open riser length
  } else if (hasOpen) {
    length = baseLength - 1.875; // Open riser length
  } else {
    length = baseLength - 1.25; // Box riser length
  }

  return { width, length };
}

/**
 * Generate cut sheets for given job orders
 */
export async function generateCutSheets(jobIds: number[]): Promise<ShopData> {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');

    // Get stair configurations for the jobs
    const configQuery = `
      SELECT sc.*, j.title as job_title, j.job_location, c.name as customer_name
      FROM stair_configurations sc
      JOIN jobs j ON sc.job_id = j.id
      JOIN customers c ON j.customer_id = c.id
      WHERE j.id = ANY($1) AND j.status = 'order'
      ORDER BY j.id, sc.id
    `;
    const configResult = await client.query(configQuery, [jobIds]);
    const configurations = configResult.rows;

    if (configurations.length === 0) {
      throw new Error('No stair configurations found for the specified orders');
    }

    // Get configuration items
    const itemsQuery = `
      SELECT sci.*, bt.name as board_type_name, mm.name as material_name
      FROM stair_config_items sci
      LEFT JOIN stair_board_types bt ON sci.board_type_id = bt.brd_typ_id
      LEFT JOIN material_multipliers mm ON sci.material_id = mm.id
      WHERE sci.config_id = ANY($1)
      ORDER BY sci.config_id, sci.riser_number, sci.item_type
    `;
    const configIds = configurations.map(c => c.id);
    const itemsResult = await client.query(itemsQuery, [configIds]);
    const configItems = itemsResult.rows;

    // Generate cut sheets
    const cutSheets: CutSheetItem[] = [];

    for (const config of configurations) {
      const items = configItems.filter(item => item.config_id === config.id);
      const stairId = config.config_name || `STAIR_${config.id}`;
      const location = config.job_location || 'UNKNOWN';

      // Group items by type
      const treads = items.filter(item => item.item_type === 'tread');
      const risers = items.filter(item => item.item_type === 'riser');
      
      // Process treads
      for (const tread of treads) {
        const dimensions = calculateTreadDimensions(config, tread);
        cutSheets.push({
          item_type: 'tread',
          tread_type: tread.tread_type,
          material: tread.material_name || 'UNKNOWN',
          quantity: tread.quantity,
          width: dimensions.width,
          length: dimensions.length,
          thickness: '1"',
          stair_id: stairId,
          location: location
        });
      }

      // Process risers
      for (const riser of risers) {
        // Find associated tread type for this riser
        const associatedTread = treads.find(t => t.riser_number === riser.riser_number);
        const treadType = associatedTread?.tread_type || 'box';
        
        const dimensions = calculateRiserDimensions(config, riser, treadType);
        cutSheets.push({
          item_type: 'riser',
          tread_type: treadType,
          material: riser.material_name || 'UNKNOWN',
          quantity: riser.quantity,
          width: dimensions.width,
          length: dimensions.length,
          stair_id: stairId,
          location: location
        });
      }

      // Add S4S (bottom riser)
      if (items.length > 0) {
        const s4sDimensions = calculateS4SDimensions(config, items);
        const s4sMaterial = risers[0]?.material_name || 'UNKNOWN';
        
        cutSheets.push({
          item_type: 's4s',
          material: s4sMaterial,
          quantity: 1,
          width: s4sDimensions.width,
          length: s4sDimensions.length,
          stair_id: stairId,
          location: location
        });
      }
    }

    // Generate shop number
    const shopNumberResult = await client.query(
      'SELECT COUNT(*) as count FROM shops WHERE DATE(created_at) = CURRENT_DATE'
    );
    const todayCount = parseInt(shopNumberResult.rows[0].count) + 1;
    const shopNumber = `SHOP-${new Date().toISOString().slice(0, 10)}-${todayCount.toString().padStart(3, '0')}`;

    // Create shop record
    const shopInsertQuery = `
      INSERT INTO shops (shop_number, cut_sheets, status, generated_date, notes, created_at)
      VALUES ($1, $2, 'generated', CURRENT_TIMESTAMP, $3, CURRENT_TIMESTAMP)
      RETURNING id, created_at
    `;
    const jobTitles = configurations.map(c => c.job_title).join(', ');
    const notes = `Generated for jobs: ${jobTitles}`;
    
    const shopResult = await client.query(shopInsertQuery, [
      shopNumber,
      JSON.stringify(cutSheets),
      notes
    ]);
    const shopId = shopResult.rows[0].id;
    const createdAt = shopResult.rows[0].created_at;

    // Mark jobs as having shops run
    await client.query(
      'UPDATE jobs SET shops_run = true, shops_run_date = CURRENT_TIMESTAMP WHERE id = ANY($1)',
      [jobIds]
    );

    // Commit transaction
    await client.query('COMMIT');

    return {
      id: shopId,
      shop_number: shopNumber,
      job_ids: jobIds,
      cut_sheets: cutSheets,
      status: 'generated',
      generated_date: createdAt
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get available orders that can have shops generated
 */
export async function getAvailableOrders(filter: 'all' | 'unrun' = 'all'): Promise<any[]> {
  let whereClause = "WHERE j.status = 'order'";
  
  if (filter === 'unrun') {
    whereClause += " AND (j.shops_run = false OR j.shops_run IS NULL)";
  }

  const query = `
    SELECT 
      j.id,
      j.title,
      j.customer_id,
      c.name as customer_name,
      j.delivery_date,
      j.shops_run,
      j.shops_run_date,
      j.created_at,
      COUNT(sc.id) as stair_config_count
    FROM jobs j
    JOIN customers c ON j.customer_id = c.id
    LEFT JOIN stair_configurations sc ON j.id = sc.job_id
    ${whereClause}
    GROUP BY j.id, c.name
    ORDER BY j.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get all shops
 */
export async function getAllShops(): Promise<any[]> {
  const query = `
    SELECT 
      s.*,
      jsonb_array_length(s.cut_sheets) as cut_sheet_count
    FROM shops s
    ORDER BY s.generated_date DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get shop by ID
 */
export async function getShopById(shopId: number): Promise<any> {
  const query = 'SELECT * FROM shops WHERE id = $1';
  const result = await pool.query(query, [shopId]);
  
  if (result.rows.length === 0) {
    throw new Error('Shop not found');
  }

  return result.rows[0];
}

/**
 * Update shop status
 */
export async function updateShopStatus(shopId: number, status: string): Promise<void> {
  const query = 'UPDATE shops SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
  await pool.query(query, [status, shopId]);
}