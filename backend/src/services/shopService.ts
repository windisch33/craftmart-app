import pool from '../config/database';

// Types for shop data
interface StairConfiguration {
  id: number;
  job_item_id: number;
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
  job_title?: string;
  job_location?: string | null;
  delivery_date?: string | Date | null;
  job_status?: string | null;
  customer_id?: number;
  customer_name?: string;
  special_notes?: string | null;
  riser_material_name?: string | null;
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
  job_id: number;
  job_title: string;
  notes?: string;
}

// Safe numeric coercion
function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(value as any);
  return Number.isFinite(n) ? n : fallback;
}

interface ShopJobSummary {
  job_id: number; // job item id
  order_number: string;
  job_title: string | null;
  lot_name: string | null;
  directions: string | null;
  customer_name: string;
  customer_address: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_zip: string | null;
  customer_phone: string | null;
  customer_fax: string | null;
  customer_cell: string | null;
  customer_email: string | null;
  contact_person: string | null;
  job_location: string | null;
  shop_date: string;
  delivery_date: string | null;
  oak_delivery_date: string | null;
  sales_rep_name: string | null;
  sales_rep_phone: string | null;
  sales_rep_email: string | null;
  order_designation: string | null;
  model_name: string | null;
  terms: string | null;
}

interface JobItemDetail {
  id: number;
  title: string | null;
  description: string | null;
  status: string | null;
  job_location: string | null;
  delivery_date: Date | null;
  order_designation: string | null;
  model_name: string | null;
  terms: string | null;
  installer: string | null;
  lot_name: string | null;
  customer_id: number | null;
  customer_name: string | null;
  customer_address: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_zip: string | null;
  customer_phone: string | null;
  customer_fax: string | null;
  customer_cell: string | null;
  customer_email: string | null;
  salesman_first_name: string | null;
  salesman_last_name: string | null;
  salesman_phone: string | null;
  salesman_email: string | null;
}

interface ShopData {
  id: number;
  shop_number: string;
  job_ids: number[];
  cut_sheets: CutSheetItem[];
  status: string;
  generated_date: string;
  jobs: ShopJobSummary[];
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
  item: StairConfigItem
): { width: number; length: number } {
  // Prefer configuration rough cut width; fallback to parsing tread_size; finally item.width
  const cfgAny: any = config as any;
  let roughCutWidth = toNumber(cfgAny.rough_cut_width, NaN);
  if (!Number.isFinite(roughCutWidth)) {
    if (typeof config.tread_size === 'string') {
      const m = config.tread_size.match(/^(\d+(?:\.\d+)?)/);
      if (m) roughCutWidth = toNumber(m[1], NaN);
    }
  }
  if (!Number.isFinite(roughCutWidth)) {
    roughCutWidth = toNumber(item.width, 11);
  }
  const nose = toNumber(config.nose_size, 0);
  const width = roughCutWidth + nose;
  // For treads, the long dimension (base length) is stored in item.width (span),
  // while item.length often holds the board rough width.
  let baseLen = toNumber(item.width, 0);
  let length = baseLen;

  // Normalize tread type to support open_left/open_right
  const treadType = (item.tread_type || '').toLowerCase();

  if (treadType === 'double_open') {
    // No reduction for double open
    length = baseLen;
  } else if (treadType.includes('open')) {
    // Covers open_left/open_right
    length = baseLen - 0.625; // single route
  } else if (treadType === 'box') {
    length = baseLen - 1.25; // two routes (0.625" each end)
  } else {
    // Default to box tread calculation if unknown
    length = baseLen - 1.25;
  }

  // Guard against negatives/NaN
  if (!Number.isFinite(length) || length < 0) length = 0;
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
  const width = toNumber(config.riser_height, 0);
  const baseLen = toNumber(item.length, 0);
  let length = baseLen;

  const treadType = (associatedTreadType || '').toLowerCase();

  if (treadType === 'double_open') {
    length = baseLen - 2.5; // two nose overhangs (1.25" each)
  } else if (treadType.includes('open')) {
    // Covers open_left/open_right
    length = baseLen - 1.875; // route (0.625") + nose overhang (1.25")
  } else if (treadType === 'box') {
    length = baseLen - 1.25; // routes
  } else {
    length = baseLen - 1.25; // default to box
  }

  if (!Number.isFinite(length) || length < 0) length = 0;
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
  const width = toNumber(config.riser_height, 0) - 1;

  // Determine S4S length based on tread types present
  const treadTypes = configItems
    .filter(item => item.item_type === 'tread')
    .map(item => item.tread_type)
    .filter(Boolean);

  const hasDoubleOpen = treadTypes.includes('double_open');
  const hasOpen = treadTypes.some(type => type?.includes('open'));

  // Base length derives from tread span (tread.width stores span per generation logic)
  const treadSpans = configItems
    .filter(item => item.item_type === 'tread')
    .map(item => toNumber(item.width, NaN))
    .filter(n => Number.isFinite(n));
  // Prefer the maximum span among treads; fallback to any available numeric; otherwise 0
  const baseLength = treadSpans.length > 0
    ? Math.max(...treadSpans)
    : 0;

  let length: number;
  if (hasDoubleOpen) {
    length = baseLength - 2.5; // Double open riser length
  } else if (hasOpen) {
    length = baseLength - 1.875; // Open riser length
  } else {
    length = baseLength - 1.25; // Box riser length
  }

  if (!Number.isFinite(length) || length < 0) length = 0;
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

    // Load job/order metadata from job_items and related tables
    const jobDetailsQuery = `
      SELECT 
        ji.id,
        ji.title,
        ji.description,
        ji.status,
        ji.job_location,
        ji.delivery_date,
        ji.order_designation,
        ji.model_name,
        ji.terms,
        ji.installer,
        proj.name AS lot_name,
        ji.customer_id,
        c.name AS customer_name,
        c.address,
        c.city,
        c.state,
        c.zip_code,
        c.phone,
        c.fax,
        c.mobile AS cell,
        c.email,
        s.first_name AS salesman_first_name,
        s.last_name AS salesman_last_name,
        s.phone AS salesman_phone,
        s.email AS salesman_email
      FROM job_items ji
      LEFT JOIN jobs proj ON ji.job_id = proj.id
      LEFT JOIN customers c ON ji.customer_id = c.id
      LEFT JOIN salesmen s ON ji.salesman_id = s.id
      WHERE ji.id = ANY($1)
    `;
    const jobDetailsResult = await client.query(jobDetailsQuery, [jobIds]);

    if (jobDetailsResult.rows.length === 0) {
      throw new Error('No jobs found for the specified IDs');
    }

    const jobDetailsMap = new Map<number, JobItemDetail>();

    for (const row of jobDetailsResult.rows) {
      const status = (row.status ?? 'order').toLowerCase();
      if (status !== 'order') {
        throw new Error(`Job ${row.id} is not eligible for shops (status: ${row.status})`);
      }

      jobDetailsMap.set(row.id, {
        id: row.id,
        title: row.title ?? null,
        description: row.description ?? null,
        status: row.status ?? null,
        job_location: row.job_location ?? null,
        delivery_date: row.delivery_date ? new Date(row.delivery_date) : null,
        order_designation: row.order_designation ?? null,
        model_name: row.model_name ?? null,
        terms: row.terms ?? null,
        installer: row.installer ?? null,
        lot_name: row.lot_name ?? null,
        customer_id: row.customer_id ?? null,
        customer_name: row.customer_name ?? null,
        customer_address: row.address ?? null,
        customer_city: row.city ?? null,
        customer_state: row.state ?? null,
        customer_zip: row.zip_code ?? null,
        customer_phone: row.phone ?? null,
        customer_fax: row.fax ?? null,
        customer_cell: row.cell ?? null,
        customer_email: row.email ?? null,
        salesman_first_name: row.salesman_first_name ?? null,
        salesman_last_name: row.salesman_last_name ?? null,
        salesman_phone: row.salesman_phone ?? null,
        salesman_email: row.salesman_email ?? null
      });
    }

    // Ensure we have details for each requested ID
    for (const jobId of jobIds) {
      if (!jobDetailsMap.has(jobId)) {
        throw new Error(`Job ${jobId} not found or missing metadata`);
      }
    }

    // Determine which stair configurations are actually quoted on these orders
    // Prefer quote_items.stair_config_id; fallback to parsing part_number 'STAIR-<id>'
    const quotedConfigIdsResult = await client.query(
      `SELECT DISTINCT
         COALESCE(
           qi.stair_config_id,
           NULLIF(REGEXP_REPLACE(qi.part_number, '^STAIR-', ''), '')::int
         ) AS config_id
       FROM quote_items qi
       WHERE qi.job_item_id = ANY($1)
         AND (
           qi.stair_config_id IS NOT NULL OR
           qi.part_number ~ '^STAIR-[0-9]+'
         )
         AND COALESCE(
               qi.stair_config_id,
               NULLIF(REGEXP_REPLACE(qi.part_number, '^STAIR-', ''), '')::int
             ) IS NOT NULL`,
      [jobIds]
    );

    const quotedConfigIds: number[] = quotedConfigIdsResult.rows
      .map((r: any) => r.config_id)
      .filter((id: any) => Number.isInteger(id));

    if (quotedConfigIds.length === 0) {
      throw new Error('No quoted stair configurations found for the specified orders');
    }

    // Load only quoted configurations that belong to the selected orders
    const configQuery = `
      SELECT sc.*, rm.material_name AS riser_material_name
      FROM stair_configurations sc
      LEFT JOIN material_multipliers rm ON sc.riser_material_id = rm.material_id
      WHERE sc.id = ANY($1) AND sc.job_item_id = ANY($2)
      ORDER BY sc.job_item_id, sc.id
    `;
    const configResult = await client.query(configQuery, [quotedConfigIds, jobIds]);
    const configurations = configResult.rows as StairConfiguration[];

    if (configurations.length === 0) {
      throw new Error('No stair configurations found for the specified orders');
    }

    // Get configuration items
    const itemsQuery = `
      SELECT sci.*, bt.brdtyp_des as board_type_name, mm.material_name as material_name
      FROM stair_config_items sci
      LEFT JOIN stair_board_types bt ON sci.board_type_id = bt.brd_typ_id
      LEFT JOIN material_multipliers mm ON sci.material_id = mm.material_id
      WHERE sci.config_id = ANY($1)
      ORDER BY sci.config_id, sci.riser_number, sci.item_type
    `;
    const configIds = configurations.map(c => c.id);
    const itemsResult = await client.query(itemsQuery, [configIds]);
    const configItems = itemsResult.rows;

    // Generate cut sheets and job summaries
    const cutSheets: CutSheetItem[] = [];
    const jobSummaryMap = new Map<number, { summary: ShopJobSummary; deliveryDateValue: Date | null }>();
    const generatedDateIso = new Date().toISOString().slice(0, 10);

    for (const config of configurations) {
      const jobId = config.job_item_id;
      const jobDetail = jobDetailsMap.get(jobId);

      if (!jobDetail) {
        throw new Error(`Missing job detail for job item ${jobId}`);
      }

      const items = configItems.filter(item => item.config_id === config.id);
      const stairId = config.config_name || `STAIR_${config.id}`;
      const locationSource = config.special_notes || jobDetail.job_location || '—';
      const location = locationSource.toString().trim().length > 0 ? locationSource.toString().trim() : '—';
      const jobTitle = jobDetail.title || jobDetail.lot_name || `Job ${jobId}`;

      if (!jobSummaryMap.has(jobId)) {
        const deliveryDateValue = jobDetail.delivery_date;
        const salesRepName = jobDetail.salesman_first_name || jobDetail.salesman_last_name
          ? [jobDetail.salesman_first_name, jobDetail.salesman_last_name].filter(Boolean).join(' ').trim() || null
          : null;

        jobSummaryMap.set(jobId, {
          summary: {
            job_id: jobId,
            order_number: `#${jobId}`,
            job_title: jobTitle,
            lot_name: jobDetail.lot_name,
            directions: jobDetail.description,
            customer_name: jobDetail.customer_name || 'Unknown Customer',
            customer_address: jobDetail.customer_address,
            customer_city: jobDetail.customer_city,
            customer_state: jobDetail.customer_state,
            customer_zip: jobDetail.customer_zip,
            customer_phone: jobDetail.customer_phone,
            customer_fax: jobDetail.customer_fax,
            customer_cell: jobDetail.customer_cell,
            customer_email: jobDetail.customer_email,
            contact_person: jobDetail.installer,
            job_location: jobDetail.job_location,
            shop_date: generatedDateIso,
            delivery_date: deliveryDateValue ? deliveryDateValue.toISOString().slice(0, 10) : null,
            oak_delivery_date: null,
            sales_rep_name: salesRepName,
            sales_rep_phone: jobDetail.salesman_phone,
            sales_rep_email: jobDetail.salesman_email,
            order_designation: jobDetail.order_designation,
            model_name: jobDetail.model_name,
            terms: jobDetail.terms
          },
          deliveryDateValue
        });
      }

      const summaryEntry = jobSummaryMap.get(jobId);
      const deliveryDate = summaryEntry?.deliveryDateValue ?? null;

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
          location: location,
          job_id: jobId,
          job_title: jobTitle
        });
      }

      // Process risers
      if (risers.length > 0) {
        for (const riser of risers) {
          // Find associated tread type for this riser
          const associatedTread = treads.find(t => t.riser_number === riser.riser_number);
          const treadType = associatedTread?.tread_type || 'box';
          
          const dimensions = calculateRiserDimensions(config, riser, treadType);
          cutSheets.push({
            item_type: 'riser',
            tread_type: treadType,
            material: (riser as any).material_name || 'Primed',
            quantity: riser.quantity,
            width: dimensions.width,
            length: dimensions.length,
            thickness: '3/4"',
            stair_id: stairId,
            location: location,
            job_id: jobId,
            job_title: jobTitle
          });
        }
      } else {
        // Fallback: synthesize risers from treads when no explicit riser items exist
        // Generate one riser per tread (covers all non-S4S risers). Do not add an extra
        // landing riser here; the S4S added below accounts for the remaining (bottom) riser,
        // keeping total risers (including S4S) equal to num_risers.
        for (const tread of treads) {
          const treadType = tread.tread_type || 'box';
          const baseLen = toNumber(tread.width, 0);
          const fakeRiser: StairConfigItem = {
            id: 0,
            config_id: config.id,
            item_type: 'riser',
            riser_number: (tread as any).riser_number,
            width: 0,
            length: baseLen,
            quantity: 1
          };
          const dimensions = calculateRiserDimensions(config, fakeRiser, treadType);
          cutSheets.push({
            item_type: 'riser',
            tread_type: treadType,
            material: (config as any).riser_material_name || 'Primed',
            quantity: 1,
            width: dimensions.width,
            length: dimensions.length,
            thickness: '3/4"',
            stair_id: stairId,
            location: location,
            job_id: jobId,
            job_title: jobTitle
          });
        }
      }

      // Add S4S (bottom riser)
      if (items.length > 0) {
        const s4sDimensions = calculateS4SDimensions(config, items);
        const s4sMaterial = risers[0]?.material_name || (config as any).riser_material_name || 'UNKNOWN';
        
        cutSheets.push({
          item_type: 's4s',
          material: s4sMaterial,
          quantity: 1,
          width: s4sDimensions.width,
          length: s4sDimensions.length,
          thickness: '3/4"',
          stair_id: stairId,
         location: location,
         job_id: jobId,
         job_title: jobTitle
        });
      }
    }

    const jobSummaries = Array.from(jobSummaryMap.values()).map(entry => entry.summary);

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
    const jobTitles = Array.from(jobDetailsMap.values())
      .map(detail => detail.title || detail.lot_name || `Job ${detail.id}`)
      .join(', ');
    const notes = `Generated for jobs: ${jobTitles}`;
    
    const shopResult = await client.query(shopInsertQuery, [
      shopNumber,
      JSON.stringify(cutSheets),
      notes
    ]);
    const shopId = shopResult.rows[0].id;
    const createdAt = shopResult.rows[0].created_at;

    // Persist job relationships for this shop
    for (const [jobId, data] of jobSummaryMap.entries()) {
      await client.query(
        `INSERT INTO shop_jobs (shop_id, job_id, job_title, customer_name, job_location, delivery_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (shop_id, job_id)
         DO UPDATE SET
           job_title = EXCLUDED.job_title,
           customer_name = EXCLUDED.customer_name,
           job_location = EXCLUDED.job_location,
           delivery_date = EXCLUDED.delivery_date`,
        [
          shopId,
          jobId,
          data.summary.job_title,
          data.summary.customer_name,
          data.summary.job_location,
          data.deliveryDateValue ? data.deliveryDateValue.toISOString().slice(0, 10) : null
        ]
      );
    }

    // Mark jobs as having shops run
    await client.query(
      'UPDATE job_items SET shops_run = true, shops_run_date = CURRENT_TIMESTAMP WHERE id = ANY($1)',
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
      generated_date: createdAt,
      jobs: jobSummaries
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
  const statusFilter = "COALESCE(ji.status, 'order')";
  const conditions: string[] = [`${statusFilter} ILIKE 'order'`];

  if (filter === 'unrun') {
    conditions.push('(COALESCE(ji.shops_run, false) = false)');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      ji.id,
      COALESCE(ji.title, 'Job ' || ji.id::text) AS job_title,
      ji.customer_id,
      c.name as customer_name,
      ji.delivery_date,
      COALESCE(ji.shops_run, false) as shops_run,
      ji.shops_run_date,
      ji.created_at,
      ${statusFilter} as job_status,
      COUNT(sc.id) as stair_config_count
    FROM job_items ji
    JOIN customers c ON ji.customer_id = c.id
    LEFT JOIN stair_configurations sc ON sc.job_item_id = ji.id
    ${whereClause}
    GROUP BY
      ji.id,
      COALESCE(ji.title, 'Job ' || ji.id::text),
      ji.customer_id,
      c.name,
      ji.delivery_date,
      COALESCE(ji.shops_run, false),
      ji.shops_run_date,
      ji.created_at,
      ${statusFilter}
    ORDER BY ji.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows.map(row => ({
    id: row.id,
    title: row.job_title,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    delivery_date: row.delivery_date,
    shops_run: row.shops_run,
    shops_run_date: row.shops_run_date,
    created_at: row.created_at,
    stair_config_count: row.stair_config_count,
    status: row.job_status
  }));
}

/**
 * Get all shops
 */
export async function getAllShops(): Promise<any[]> {
  const query = `
    SELECT 
      s.*,
      COALESCE(jsonb_array_length(s.cut_sheets), 0) as cut_sheet_count,
      COALESCE(
        json_agg(
          json_build_object(
            'job_id', sj.job_id,
            'order_number', '#' || ji.id::text,
            'job_title', COALESCE(sj.job_title, ji.title, 'Job ' || ji.id::text),
            'lot_name', proj.name,
            'directions', ji.description,
            'customer_name', COALESCE(sj.customer_name, c.name),
            'customer_address', c.address,
            'customer_city', c.city,
            'customer_state', c.state,
            'customer_zip', c.zip_code,
            'customer_phone', c.phone,
            'customer_fax', c.fax,
            'customer_cell', c.mobile,
            'customer_email', c.email,
            'contact_person', ji.installer,
            'job_location', COALESCE(sj.job_location, ji.job_location),
            'shop_date', TO_CHAR(s.generated_date::date, 'YYYY-MM-DD'),
            'delivery_date', COALESCE(TO_CHAR(sj.delivery_date, 'YYYY-MM-DD'), TO_CHAR(ji.delivery_date, 'YYYY-MM-DD')),
            'oak_delivery_date', NULL,
            'sales_rep_name', CASE WHEN s2.id IS NOT NULL THEN TRIM(BOTH ' ' FROM (COALESCE(s2.first_name, '') || ' ' || COALESCE(s2.last_name, ''))) ELSE NULL END,
            'sales_rep_phone', s2.phone,
            'sales_rep_email', s2.email,
            'order_designation', ji.order_designation,
            'model_name', ji.model_name,
            'terms', ji.terms
          )
          ORDER BY sj.job_id
        ) FILTER (WHERE sj.job_id IS NOT NULL),
        '[]'::json
      ) as jobs
    FROM shops s
    LEFT JOIN shop_jobs sj ON sj.shop_id = s.id
    LEFT JOIN job_items ji ON sj.job_id = ji.id
    LEFT JOIN jobs proj ON ji.job_id = proj.id
    LEFT JOIN customers c ON ji.customer_id = c.id
    LEFT JOIN salesmen s2 ON ji.salesman_id = s2.id
    GROUP BY s.id
    ORDER BY s.generated_date DESC, s.id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get shop by ID
 */
export async function getShopById(shopId: number): Promise<any> {
  const query = `
    SELECT 
      s.*,
      COALESCE(jsonb_array_length(s.cut_sheets), 0) as cut_sheet_count,
      COALESCE(
        json_agg(
          json_build_object(
            'job_id', sj.job_id,
            'order_number', '#' || ji.id::text,
            'job_title', COALESCE(sj.job_title, ji.title, 'Job ' || ji.id::text),
            'lot_name', proj.name,
            'directions', ji.description,
            'customer_name', COALESCE(sj.customer_name, c.name),
            'customer_address', c.address,
            'customer_city', c.city,
            'customer_state', c.state,
            'customer_zip', c.zip_code,
            'customer_phone', c.phone,
            'customer_fax', c.fax,
            'customer_cell', c.mobile,
            'customer_email', c.email,
            'contact_person', ji.installer,
            'job_location', COALESCE(sj.job_location, ji.job_location),
            'shop_date', TO_CHAR(s.generated_date::date, 'YYYY-MM-DD'),
            'delivery_date', COALESCE(TO_CHAR(sj.delivery_date, 'YYYY-MM-DD'), TO_CHAR(ji.delivery_date, 'YYYY-MM-DD')),
            'oak_delivery_date', NULL,
            'sales_rep_name', CASE WHEN s2.id IS NOT NULL THEN TRIM(BOTH ' ' FROM (COALESCE(s2.first_name, '') || ' ' || COALESCE(s2.last_name, ''))) ELSE NULL END,
            'sales_rep_phone', s2.phone,
            'sales_rep_email', s2.email,
            'order_designation', ji.order_designation,
            'model_name', ji.model_name,
            'terms', ji.terms
          )
          ORDER BY sj.job_id
        ) FILTER (WHERE sj.job_id IS NOT NULL),
        '[]'::json
      ) as jobs
    FROM shops s
    LEFT JOIN shop_jobs sj ON sj.shop_id = s.id
    LEFT JOIN job_items ji ON sj.job_id = ji.id
    LEFT JOIN jobs proj ON ji.job_id = proj.id
    LEFT JOIN customers c ON ji.customer_id = c.id
    LEFT JOIN salesmen s2 ON ji.salesman_id = s2.id
    WHERE s.id = $1
    GROUP BY s.id
  `;
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
