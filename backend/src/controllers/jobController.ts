import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { generateJobPDF, getJobPDFFilename } from '../services/pdfService';
import { pdfCache } from '../services/pdfCache';

// Helper function to calculate tax based on customer state
const calculateTaxForState = async (stateCode: string): Promise<number> => {
  try {
    const result = await pool.query(
      'SELECT rate FROM tax_rates WHERE state_code = $1 AND is_active = true ORDER BY effective_date DESC LIMIT 1',
      [stateCode]
    );
    return result.rows.length > 0 ? parseFloat(result.rows[0].rate) : 0;
  } catch (error) {
    console.error('Error calculating tax rate:', error);
    return 0;
  }
};

// Helper function to calculate job totals
const calculateJobTotals = async (jobId: number): Promise<{ subtotal: number; laborTotal: number; taxAmount: number; total: number }> => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN is_taxable = true THEN line_total ELSE 0 END), 0) as taxable_total,
        COALESCE(SUM(CASE WHEN is_taxable = false THEN line_total ELSE 0 END), 0) as non_taxable_total,
        COALESCE(SUM(line_total), 0) as subtotal
      FROM quote_items 
      WHERE job_item_id = $1
    `, [jobId]);

    const jobResult = await pool.query('SELECT tax_rate FROM job_items WHERE id = $1', [jobId]);
    const taxRate = jobResult.rows[0]?.tax_rate || 0;

    const taxableTotal = parseFloat(result.rows[0].taxable_total);
    const laborTotal = parseFloat(result.rows[0].non_taxable_total);
    const subtotal = parseFloat(result.rows[0].subtotal);
    const taxAmount = taxableTotal * taxRate;
    const total = subtotal + taxAmount;

    return { subtotal: subtotal - laborTotal, laborTotal, taxAmount, total };
  } catch (error) {
    console.error('Error calculating job totals:', error);
    return { subtotal: 0, laborTotal: 0, taxAmount: 0, total: 0 };
  }
};

export const getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      status, 
      salesman_id,
      customer_id,
      project_id,
      recent,
      // Advanced search parameters
      searchTerm,
      searchField,
      searchOperator,
      // Filter parameters
      statusFilter,
      salesmanFilter,
      dateRangeType,
      dateRangeStart,
      dateRangeEnd,
      amountRangeType,
      amountRangeMin,
      amountRangeMax,
      // Sort parameters
      sortBy,
      sortOrder
    } = req.query;

    let query = `
      SELECT j.*, 
             CAST(j.subtotal AS FLOAT) as subtotal,
             CAST(j.labor_total AS FLOAT) as labor_total,
             CAST(j.tax_amount AS FLOAT) as tax_amount,
             CAST(j.total_amount AS FLOAT) as total_amount,
             CAST(j.tax_rate AS FLOAT) as tax_rate,
             c.name as customer_name, c.state as customer_state,
             s.first_name as salesman_first_name, s.last_name as salesman_last_name,
             (s.first_name || ' ' || s.last_name) as salesman_name,
             COALESCE(da.deposit_total, 0) AS deposit_total,
             CAST(COALESCE(j.total_amount, 0) - COALESCE(da.deposit_total, 0) AS FLOAT) AS balance_due
      FROM job_items j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      LEFT JOIN salesmen s ON j.salesman_id = s.id
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(amount), 0) AS deposit_total
        FROM deposit_allocations da
        WHERE da.job_item_id = j.id
      ) da ON TRUE
    `;
    
    let queryParams: any[] = [];
    const conditions: string[] = [];

    // Legacy status and salesman_id filters (for backward compatibility)
    if (status && status !== 'all') {
      conditions.push(`j.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (salesman_id) {
      conditions.push(`j.salesman_id = $${queryParams.length + 1}`);
      queryParams.push(salesman_id);
    }

    if (customer_id) {
      conditions.push(`j.customer_id = $${queryParams.length + 1}`);
      queryParams.push(customer_id);
    }

    if (project_id) {
      conditions.push(`j.job_id = $${queryParams.length + 1}`);
      queryParams.push(project_id);
    }

    // Advanced search functionality
    if (searchTerm && searchTerm.toString().trim()) {
      const term = searchTerm.toString().trim();
      const field = searchField?.toString() || 'title';
      const operator = searchOperator?.toString() || 'contains';
      
      let searchCondition = '';
      
      if (field === 'all') {
        // Search across multiple fields
        const searchFields = [
          'j.title',
          'j.description',
          'c.name',
          '(s.first_name || \' \' || s.last_name)',
          'j.po_number',
          'j.id::text'
        ];
        
        if (operator === 'exact') {
          searchCondition = searchFields.map(f => `${f} = $${queryParams.length + 1}`).join(' OR ');
        } else if (operator === 'startsWith') {
          searchCondition = searchFields.map(f => `${f} ILIKE $${queryParams.length + 1}`).join(' OR ');
          queryParams.push(`${term}%`);
        } else { // contains
          searchCondition = searchFields.map(f => `${f} ILIKE $${queryParams.length + 1}`).join(' OR ');
          queryParams.push(`%${term}%`);
        }
        
        if (operator === 'exact') {
          queryParams.push(term);
        }
      } else {
        // Search in specific field
        let fieldName = '';
        switch (field) {
          case 'title':
            fieldName = 'j.title';
            break;
          case 'customer':
            fieldName = 'c.name';
            break;
          case 'jobNumber':
            fieldName = 'j.id::text';
            break;
          case 'salesman':
            fieldName = '(s.first_name || \' \' || s.last_name)';
            break;
          case 'poNumber':
            fieldName = 'j.po_number';
            break;
          default:
            fieldName = 'j.title';
        }
        
        if (operator === 'exact') {
          searchCondition = `${fieldName} = $${queryParams.length + 1}`;
          queryParams.push(term);
        } else if (operator === 'startsWith') {
          searchCondition = `${fieldName} ILIKE $${queryParams.length + 1}`;
          queryParams.push(`${term}%`);
        } else { // contains
          searchCondition = `${fieldName} ILIKE $${queryParams.length + 1}`;
          queryParams.push(`%${term}%`);
        }
      }
      
      conditions.push(`(${searchCondition})`);
    }

    // Status filter (array support)
    if (statusFilter && statusFilter !== 'all') {
      const statusArray = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
      if (statusArray.length > 0) {
        const statusPlaceholders = statusArray.map((_, index) => `$${queryParams.length + index + 1}`).join(', ');
        conditions.push(`j.status IN (${statusPlaceholders})`);
        queryParams.push(...statusArray);
      }
    }

    // Salesman filter (array support)
    if (salesmanFilter && Array.isArray(salesmanFilter) && salesmanFilter.length > 0) {
      const salesmanPlaceholders = salesmanFilter.map((_, index) => `$${queryParams.length + index + 1}`).join(', ');
      conditions.push(`j.salesman_id IN (${salesmanPlaceholders})`);
      queryParams.push(...salesmanFilter.map(id => parseInt(id.toString())));
    }

    // Date range filter
    if (dateRangeStart || dateRangeEnd) {
      const dateField = (() => {
        switch (dateRangeType?.toString()) {
          case 'updated':
            return 'j.updated_at';
          case 'delivery':
            return 'j.delivery_date';
          default:
            return 'j.created_at';
        }
      })();

      if (dateRangeStart) {
        conditions.push(`${dateField}::date >= $${queryParams.length + 1}`);
        queryParams.push(dateRangeStart);
      }

      if (dateRangeEnd) {
        conditions.push(`${dateField}::date <= $${queryParams.length + 1}`);
        queryParams.push(dateRangeEnd);
      }
    }

    // Amount range filter (allow 0 as a valid boundary)
    if (amountRangeMin !== undefined || amountRangeMax !== undefined) {
      const amountField = (() => {
        switch (amountRangeType?.toString()) {
          case 'subtotal':
            return 'j.subtotal';
          case 'labor':
            return 'j.labor_total';
          default:
            return 'j.total_amount';
        }
      })();

      if (amountRangeMin !== undefined) {
        const minVal = parseFloat(amountRangeMin.toString());
        if (!Number.isNaN(minVal) && minVal >= 0) {
          conditions.push(`${amountField} >= $${queryParams.length + 1}`);
          queryParams.push(minVal);
        }
      }

      if (amountRangeMax !== undefined) {
        const maxVal = parseFloat(amountRangeMax.toString());
        if (!Number.isNaN(maxVal) && maxVal >= 0) {
          conditions.push(`${amountField} <= $${queryParams.length + 1}`);
          queryParams.push(maxVal);
        }
      }
    }

    // Apply WHERE conditions
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Apply sorting
    const validSortFields = ['created_date', 'total_amount', 'customer_name', 'title', 'updated_at'];
    const sortField = validSortFields.includes(sortBy?.toString() || '') ? sortBy : 'created_date';
    const order = sortOrder?.toString() === 'asc' ? 'ASC' : 'DESC';
    
    let orderByClause = '';
    switch (sortField) {
      case 'created_date':
        orderByClause = `j.created_at ${order}`;
        break;
      case 'updated_at':
        orderByClause = `j.updated_at ${order}`;
        break;
      case 'total_amount':
        orderByClause = `j.total_amount ${order}`;
        break;
      case 'customer_name':
        orderByClause = `c.name ${order}`;
        break;
      case 'title':
        orderByClause = `j.title ${order}`;
        break;
      default:
        orderByClause = `j.created_at ${order}`;
    }
    
    query += ` ORDER BY ${orderByClause}`;
    
    // If recent parameter is true, get only the last 10 updated jobs
    if (recent === 'true') {
      query = `
        SELECT j.*, 
               CAST(j.subtotal AS FLOAT) as subtotal,
               CAST(j.labor_total AS FLOAT) as labor_total,
               CAST(j.tax_amount AS FLOAT) as tax_amount,
               CAST(j.total_amount AS FLOAT) as total_amount,
               CAST(j.tax_rate AS FLOAT) as tax_rate,
               c.name as customer_name, c.state as customer_state,
               s.first_name as salesman_first_name, s.last_name as salesman_last_name,
               (s.first_name || ' ' || s.last_name) as salesman_name
        FROM job_items j 
        LEFT JOIN customers c ON j.customer_id = c.id 
        LEFT JOIN salesmen s ON j.salesman_id = s.id
        ORDER BY j.updated_at DESC
        LIMIT 10
      `;
      queryParams = [];
    }

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getAllJobs:', error);
    next(error);
  }
};

export const getJobById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT j.*, 
             c.name as customer_name, c.address, c.city, c.state, c.zip_code,
             c.phone, c.mobile, c.email, c.accounting_email,
             s.first_name as salesman_first_name, s.last_name as salesman_last_name,
             (s.first_name || ' ' || s.last_name) as salesman_name,
             s.email as salesman_email, s.phone as salesman_phone,
             COALESCE(da.deposit_total, 0) AS deposit_total,
             CAST(COALESCE(j.total_amount, 0) - COALESCE(da.deposit_total, 0) AS FLOAT) AS balance_due
      FROM job_items j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      LEFT JOIN salesmen s ON j.salesman_id = s.id
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(amount), 0) AS deposit_total
        FROM deposit_allocations da
        WHERE da.job_item_id = j.id
      ) da ON TRUE
      WHERE j.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getJobWithDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Get job with customer and salesman info
    const jobResult = await pool.query(`
      SELECT j.*, 
             CAST(j.subtotal AS FLOAT) as subtotal,
             CAST(j.labor_total AS FLOAT) as labor_total,
             CAST(j.tax_amount AS FLOAT) as tax_amount,
             CAST(j.total_amount AS FLOAT) as total_amount,
             CAST(j.tax_rate AS FLOAT) as tax_rate,
             c.name as customer_name, c.address, c.city, c.state, c.zip_code,
             c.phone, c.mobile, c.email, c.accounting_email,
             s.first_name as salesman_first_name, s.last_name as salesman_last_name,
             s.email as salesman_email, s.phone as salesman_phone,
             COALESCE(da.deposit_total, 0) AS deposit_total,
             CAST(COALESCE(j.total_amount, 0) - COALESCE(da.deposit_total, 0) AS FLOAT) AS balance_due
      FROM job_items j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      LEFT JOIN salesmen s ON j.salesman_id = s.id
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(amount), 0) AS deposit_total
        FROM deposit_allocations da
        WHERE da.job_item_id = j.id
      ) da ON TRUE
      WHERE j.id = $1
    `, [id]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get job sections with their items
    const sectionsResult = await pool.query(`
      SELECT js.*, 
             COALESCE(json_agg(
               json_build_object(
                 'id', qi.id,
                 'part_number', qi.part_number,
                 'description', qi.description,
                 'quantity', CAST(qi.quantity AS FLOAT),
                 'unit_price', CAST(qi.unit_price AS FLOAT),
                 'line_total', CAST(qi.line_total AS FLOAT),
                 'is_taxable', qi.is_taxable,
                 'stair_config_id', qi.stair_config_id
               ) ORDER BY qi.created_at
             ) FILTER (WHERE qi.id IS NOT NULL), '[]') as items
      FROM job_sections js
      LEFT JOIN quote_items qi ON js.id = qi.section_id
      WHERE js.job_item_id = $1
      GROUP BY js.id
      ORDER BY js.display_order, js.id
    `, [id]);

    const job = jobResult.rows[0];
    const sections = sectionsResult.rows;

    res.json({
      ...job,
      sections
    });
  } catch (error) {
    next(error);
  }
};

export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      customer_id, project_id, salesman_id, title, description, status = 'quote',
      delivery_date, job_location, order_designation, model_name, installer, terms,
      po_number,
      show_line_pricing = true
    } = req.body;
    
    // Validate required fields - either customer_id or project_id must be provided
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    let finalCustomerId = customer_id;

    // If project_id is provided, get customer from project
    if (project_id) {
      const projectResult = await pool.query('SELECT customer_id FROM jobs WHERE id = $1', [project_id]);
      if (projectResult.rows.length === 0) {
        return res.status(400).json({ error: 'Project not found' });
      }
      finalCustomerId = projectResult.rows[0].customer_id;
    } else if (!customer_id) {
      return res.status(400).json({ error: 'Either customer ID or project ID is required' });
    }

    // Get customer state for tax calculation
    const customerResult = await pool.query('SELECT state FROM customers WHERE id = $1', [finalCustomerId]);
    if (customerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    const customerState = customerResult.rows[0].state;
    const taxRate = customerState ? await calculateTaxForState(customerState) : 0;
    
    const result = await pool.query(
      `INSERT INTO job_items (
        customer_id, job_id, salesman_id, title, description, status,
        delivery_date, job_location, order_designation, model_name, installer, terms,
        po_number, show_line_pricing, tax_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [finalCustomerId, project_id || null, salesman_id, title, description, status,
       delivery_date, job_location, order_designation, model_name, installer, terms,
       po_number || null, show_line_pricing, taxRate]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    // Build dynamic update query
    const allowedFields = [
      'customer_id', 'job_id', 'salesman_id', 'title', 'description', 'status',
      'delivery_date', 'job_location', 'order_designation', 'model_name', 
      'installer', 'terms', 'po_number', 'show_line_pricing'
    ];
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    for (const [key, value] of Object.entries(updateFields)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCounter}`);
        // Convert empty strings to null for date fields
        const processedValue = (key === 'delivery_date' && value === '') ? null : value;
        values.push(processedValue);
        paramCounter++;
      }
    }

    // If customer_id is changing, recompute tax_rate based on the new customer's state
    if (Object.prototype.hasOwnProperty.call(updateFields, 'customer_id')) {
      const newCustomerId = updateFields.customer_id;
      if (newCustomerId !== undefined && newCustomerId !== null) {
        try {
          const customerResult = await pool.query('SELECT state FROM customers WHERE id = $1', [newCustomerId]);
          if (customerResult.rows.length === 0) {
            return res.status(400).json({ error: 'Customer not found' });
          }
          const customerState = customerResult.rows[0].state as string | null;
          const newTaxRate = customerState ? await calculateTaxForState(customerState) : 0;
          updates.push(`tax_rate = $${paramCounter}`);
          values.push(newTaxRate);
          paramCounter++;
        } catch (e) {
          console.error('Failed to recompute tax_rate on customer change:', e);
        }
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.push('updated_at = NOW()');
    values.push(id);
    
    const query = `UPDATE job_items SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Recalculate totals
    const totals = await calculateJobTotals(parseInt(id!));
    await pool.query(
      'UPDATE job_items SET subtotal = $1, labor_total = $2, tax_amount = $3, total_amount = $4 WHERE id = $5',
      [totals.subtotal, totals.laborTotal, totals.taxAmount, totals.total, id]
    );
    
    // Invalidate PDF cache for this job
    await pdfCache.invalidateJob(parseInt(id!));
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM job_items WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Job Sections Management
export const getJobSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const result = await pool.query(
      'SELECT * FROM job_sections WHERE job_item_id = $1 ORDER BY display_order, id',
      [jobId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const createJobSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const { name, display_order = 0 } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Section name is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO job_sections (job_item_id, name, display_order) VALUES ($1, $2, $3) RETURNING *',
      [jobId, name, display_order]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateJobSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;
    const { name, display_order } = req.body;
    
    const result = await pool.query(
      `UPDATE job_sections SET 
        name = COALESCE($1, name), 
        display_order = COALESCE($2, display_order),
        updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [name, display_order, sectionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteJobSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;
    const result = await pool.query('DELETE FROM job_sections WHERE id = $1 RETURNING *', [sectionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Quote Items Management
export const addQuoteItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId, sectionId } = req.params;
    const { part_number, description, quantity = 1, unit_price = 0, is_taxable = true, stair_configuration, product_id, length_inches } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Validate that the section belongs to the specified job
    try {
      const ownership = await pool.query(
        'SELECT 1 FROM job_sections WHERE id = $1 AND job_item_id = $2',
        [sectionId, jobId]
      );
      if (ownership.rowCount === 0) {
        return res.status(400).json({ error: 'Section does not belong to specified job' });
      }
    } catch (e) {
      console.error('Ownership validation failed:', e);
      return res.status(500).json({ error: 'Failed to validate section ownership' });
    }
    
    // Validate handrail length if this is a handrail product
    if (product_id && length_inches !== undefined) {
      // Check if this is a handrail product by querying the products table
      const productResult = await pool.query('SELECT product_type FROM products WHERE id = $1', [product_id]);
      
      if (productResult.rows.length > 0 && productResult.rows[0].product_type === 'handrail') {
        // Validate length is in 6" increments
        if (length_inches % 6 !== 0 || length_inches < 6 || length_inches > 240) {
          return res.status(400).json({ 
            error: 'Handrail length must be in 6" increments between 6" and 240"' 
          });
        }
      }
    }
    
    const lineTotal = quantity * unit_price;
    let stairConfigId = null;
    let finalPartNumber = part_number;
    
    // Check if this is a stair configuration item
    if (part_number === 'STAIR-CONFIG' && stair_configuration) {
      // Log received stair configuration data for debugging
      console.log('[JOB_CONTROLLER] Creating stair configuration via addQuoteItem');
      console.log('[JOB_CONTROLLER] Full stair_configuration object:', JSON.stringify(stair_configuration, null, 2));
      console.log('[JOB_CONTROLLER] Has individualStringers?', !!stair_configuration.individualStringers);
      console.log('[JOB_CONTROLLER] individualStringers data:', JSON.stringify(stair_configuration.individualStringers, null, 2));
      
      // Extract individual stringer data
      const leftStringer = stair_configuration.individualStringers?.left;
      const rightStringer = stair_configuration.individualStringers?.right;
      const centerStringer = stair_configuration.individualStringers?.center;
      
      console.log('[JOB_CONTROLLER] Extracted left stringer:', JSON.stringify(leftStringer, null, 2));
      console.log('[JOB_CONTROLLER] Extracted right stringer:', JSON.stringify(rightStringer, null, 2));
      console.log('[JOB_CONTROLLER] Extracted center stringer:', JSON.stringify(centerStringer, null, 2));
      
      // Create the stair configuration first (riser_height is computed, don't insert it)
      const stairResult = await pool.query(
        `INSERT INTO stair_configurations (
          job_item_id, config_name, floor_to_floor, num_risers,
          tread_material_id, riser_material_id, tread_size, rough_cut_width, nose_size,
          stringer_type, stringer_material_id, num_stringers, center_horses, full_mitre,
          bracket_type, special_notes, subtotal, labor_total, tax_amount, total_amount,
          left_stringer_width, left_stringer_thickness, left_stringer_material_id,
          right_stringer_width, right_stringer_thickness, right_stringer_material_id,
          center_stringer_width, center_stringer_thickness, center_stringer_material_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29) 
        RETURNING id`,
        [
          jobId,
          stair_configuration.configName || description,
          stair_configuration.floorToFloor || 108,
          stair_configuration.numRisers || 14,
          stair_configuration.treadMaterialId || 5,
          stair_configuration.riserMaterialId || 4,
          stair_configuration.treadSize || '10x1.25',
          stair_configuration.roughCutWidth || 10,
          stair_configuration.noseSize || 1.25,
          stair_configuration.stringerType || '1x9.25_Poplar',
          stair_configuration.stringerMaterialId || 7,
          stair_configuration.numStringers || 2,
          stair_configuration.centerHorses || 0,
          stair_configuration.fullMitre || false,
          stair_configuration.bracketType || null,
          stair_configuration.specialNotes || null,
          stair_configuration.subtotal || unit_price,
          stair_configuration.laborTotal || 0,
          stair_configuration.taxAmount || 0,
          stair_configuration.totalAmount || unit_price,
          leftStringer?.width,
          leftStringer?.thickness,
          leftStringer?.materialId,
          rightStringer?.width,
          rightStringer?.thickness,
          rightStringer?.materialId,
          centerStringer?.width,
          centerStringer?.thickness,
          centerStringer?.materialId
        ]
      );
      
      console.log('[JOB_CONTROLLER] SQL INSERT values for individual stringers:');
      console.log('[JOB_CONTROLLER]   Left - width:', leftStringer?.width, 'thickness:', leftStringer?.thickness, 'materialId:', leftStringer?.materialId);
      console.log('[JOB_CONTROLLER]   Right - width:', rightStringer?.width, 'thickness:', rightStringer?.thickness, 'materialId:', rightStringer?.materialId);
      console.log('[JOB_CONTROLLER]   Center - width:', centerStringer?.width, 'thickness:', centerStringer?.thickness, 'materialId:', centerStringer?.materialId);
      
      stairConfigId = stairResult.rows[0].id;
      finalPartNumber = `STAIR-${stairConfigId}`;
      
      // If stair items were provided, insert them
      if (stair_configuration.items && Array.isArray(stair_configuration.items)) {
        for (const item of stair_configuration.items) {
          await pool.query(
            `INSERT INTO stair_config_items (
              config_id, item_type, riser_number, tread_type, width, length,
              material_id, quantity, unit_price, total_price
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              stairConfigId,
              item.itemType || 'tread',
              item.riserNumber || null,
              item.treadType || 'box',
              item.stairWidth || item.width || 0,
              (item as any).stairLength || (item as any).length || null,
              item.materialId || 5,
              item.quantity || 1,
              item.unitPrice || 0,
              item.totalPrice || 0
            ]
          );
        }
      }
    }
    
    const result = await pool.query(
      `INSERT INTO quote_items (
        job_item_id, section_id, part_number, description, quantity, unit_price, line_total, is_taxable,
        product_type, product_name, stair_config_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [jobId, sectionId, finalPartNumber, description, quantity, unit_price, lineTotal, is_taxable, 'custom', description, stairConfigId]
    );
    
    // Recalculate job totals
    const totals = await calculateJobTotals(parseInt(jobId!));
    await pool.query(
      'UPDATE job_items SET subtotal = $1, labor_total = $2, tax_amount = $3, total_amount = $4 WHERE id = $5',
      [totals.subtotal, totals.laborTotal, totals.taxAmount, totals.total, jobId]
    );
    
    // Invalidate PDF cache for this job
    await pdfCache.invalidateJob(parseInt(jobId!));
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateQuoteItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const { part_number, description, quantity, unit_price, is_taxable, stair_configuration, stair_config_id, product_id, length_inches } = req.body;
    
    // Validate handrail length if this is a handrail product
    if (product_id && length_inches !== undefined) {
      // Check if this is a handrail product by querying the products table
      const productResult = await pool.query('SELECT product_type FROM products WHERE id = $1', [product_id]);
      
      if (productResult.rows.length > 0 && productResult.rows[0].product_type === 'handrail') {
        // Validate length is in 6" increments
        if (length_inches % 6 !== 0 || length_inches < 6 || length_inches > 240) {
          return res.status(400).json({ 
            error: 'Handrail length must be in 6" increments between 6" and 240"' 
          });
        }
      }
    }
    
    // Calculate new line total if quantity or unit_price changed
    let lineTotal: number | undefined;
    if (quantity !== undefined && unit_price !== undefined) {
      lineTotal = quantity * unit_price;
    }
    
    let stairConfigId = null;
    let finalPartNumber = part_number;
    
    // Check if this is a stair configuration update
    if ((part_number === 'STAIR-CONFIG' || (part_number && part_number.startsWith('STAIR-'))) && stair_configuration) {
      // Get the job_id for this item
      const itemResult = await pool.query('SELECT job_item_id as job_id, stair_config_id FROM quote_items WHERE id = $1', [itemId]);
      if (itemResult.rows.length === 0) {
        return res.status(404).json({ error: 'Quote item not found' });
      }
      
      const jobId = itemResult.rows[0].job_id;
      let existingConfigId = stair_config_id || itemResult.rows[0].stair_config_id;
      
      // If stair_config_id is NULL, try to find existing configuration for this job
      if (!existingConfigId) {
        console.log(`UPDATE: No stair_config_id found for item ${itemId}, searching for existing config for job ${jobId}`);
        const existingConfigResult = await pool.query(
          'SELECT id FROM stair_configurations WHERE job_item_id = $1 ORDER BY created_at DESC LIMIT 1',
          [jobId]
        );
        if (existingConfigResult.rows.length > 0) {
          existingConfigId = existingConfigResult.rows[0].id;
          console.log(`UPDATE: Found existing config ${existingConfigId} for job ${jobId}, will update it`);
          // Update the quote item to reference this configuration
          await pool.query('UPDATE quote_items SET stair_config_id = $1, part_number = $2 WHERE id = $3', 
            [existingConfigId, `STAIR-${existingConfigId}`, itemId]);
        }
      }
      
      if (existingConfigId) {
        // Update existing stair configuration
        console.log(`UPDATE: Updating stair configuration ${existingConfigId} with data:`, {
          floorToFloor: stair_configuration.floorToFloor,
          numRisers: stair_configuration.numRisers,
          itemCount: stair_configuration.items?.length || 0
        });
        
        // Extract individual stringer data for update
        const leftStringer = stair_configuration.individualStringers?.left;
        const rightStringer = stair_configuration.individualStringers?.right;
        const centerStringer = stair_configuration.individualStringers?.center;
        console.log(`UPDATE: Individual stringers - Left: ${JSON.stringify(leftStringer)}, Right: ${JSON.stringify(rightStringer)}, Center: ${JSON.stringify(centerStringer)}`);
        await pool.query(
          `UPDATE stair_configurations SET 
            config_name = $1, floor_to_floor = $2, num_risers = $3,
            tread_material_id = $4, riser_material_id = $5, tread_size = $6, rough_cut_width = $7, nose_size = $8,
            stringer_type = $9, stringer_material_id = $10, num_stringers = $11, center_horses = $12, full_mitre = $13,
            bracket_type = $14, special_notes = $15, subtotal = $16, labor_total = $17, tax_amount = $18, total_amount = $19,
            left_stringer_width = $20, left_stringer_thickness = $21, left_stringer_material_id = $22,
            right_stringer_width = $23, right_stringer_thickness = $24, right_stringer_material_id = $25,
            center_stringer_width = $26, center_stringer_thickness = $27, center_stringer_material_id = $28
           WHERE id = $29`,
          [
            stair_configuration.configName || description,
            stair_configuration.floorToFloor || 108,
            stair_configuration.numRisers || 14,
            stair_configuration.treadMaterialId || 5,
            stair_configuration.riserMaterialId || 4,
            stair_configuration.treadSize || '10x1.25',
            stair_configuration.roughCutWidth || 10,
            stair_configuration.noseSize || 1.25,
            stair_configuration.stringerType || '1x9.25_Poplar',
            stair_configuration.stringerMaterialId || 7,
            stair_configuration.numStringers || 2,
            stair_configuration.centerHorses || 0,
            stair_configuration.fullMitre || false,
            stair_configuration.bracketType || null,
            stair_configuration.specialNotes || null,
            stair_configuration.subtotal || unit_price,
            stair_configuration.laborTotal || 0,
            stair_configuration.taxAmount || 0,
            stair_configuration.totalAmount || unit_price,
            leftStringer?.width,
            leftStringer?.thickness,
            leftStringer?.materialId,
            rightStringer?.width,
            rightStringer?.thickness,
            rightStringer?.materialId,
            centerStringer?.width,
            centerStringer?.thickness,
            centerStringer?.materialId,
            existingConfigId
          ]
        );
        
        stairConfigId = existingConfigId;
        finalPartNumber = `STAIR-${stairConfigId}`;
        
        // Update stair configuration items (delete old ones and insert new ones)
        console.log(`UPDATE: Deleting existing config items for config ${existingConfigId}`);
        await pool.query('DELETE FROM stair_config_items WHERE config_id = $1', [existingConfigId]);
        
        if (stair_configuration.items && Array.isArray(stair_configuration.items)) {
          console.log(`UPDATE: Inserting ${stair_configuration.items.length} new config items`);
          for (const item of stair_configuration.items) {
            await pool.query(
              `INSERT INTO stair_config_items (
                config_id, item_type, riser_number, tread_type, width, length,
                material_id, quantity, unit_price, total_price
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                stairConfigId,
                item.itemType || 'tread',
                item.riserNumber || null,
                item.treadType || 'box',
                item.stairWidth || item.width || 0,
                (item as any).stairLength || (item as any).length || null,
                item.materialId || 5,
                item.quantity || 1,
                item.unitPrice || 0,
                item.totalPrice || 0
              ]
            );
          }
        }
      } else {
        // Create new stair configuration (this shouldn't normally happen in update, but handle it)
        const stairResult = await pool.query(
          `INSERT INTO stair_configurations (
            job_id, config_name, floor_to_floor, num_risers,
            tread_material_id, riser_material_id, tread_size, rough_cut_width, nose_size,
            stringer_type, stringer_material_id, num_stringers, center_horses, full_mitre,
            bracket_type, special_notes, subtotal, labor_total, tax_amount, total_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) 
          RETURNING id`,
          [
            jobId,
            stair_configuration.configName || description,
            stair_configuration.floorToFloor || 108,
            stair_configuration.numRisers || 14,
            stair_configuration.treadMaterialId || 5,
            stair_configuration.riserMaterialId || 4,
            stair_configuration.treadSize || '10x1.25',
            stair_configuration.roughCutWidth || 10,
            stair_configuration.noseSize || 1.25,
            stair_configuration.stringerType || '1x9.25_Poplar',
            stair_configuration.stringerMaterialId || 7,
            stair_configuration.numStringers || 2,
            stair_configuration.centerHorses || 0,
            stair_configuration.fullMitre || false,
            stair_configuration.bracketType || null,
            stair_configuration.specialNotes || null,
            stair_configuration.subtotal || unit_price,
            stair_configuration.laborTotal || 0,
            stair_configuration.taxAmount || 0,
            stair_configuration.totalAmount || unit_price
          ]
        );
        
        stairConfigId = stairResult.rows[0].id;
        finalPartNumber = `STAIR-${stairConfigId}`;
        
        // Insert stair configuration items
        if (stair_configuration.items && Array.isArray(stair_configuration.items)) {
          for (const item of stair_configuration.items) {
            await pool.query(
              `INSERT INTO stair_config_items (
                config_id, item_type, riser_number, tread_type, width, length,
                material_id, quantity, unit_price, total_price
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                stairConfigId,
                item.itemType || 'tread',
                item.riserNumber || null,
                item.treadType || 'box',
                item.stairWidth || item.width || 0,
                (item as any).stairLength || (item as any).length || null,
                item.materialId || 5,
                item.quantity || 1,
                item.unitPrice || 0,
                item.totalPrice || 0
              ]
            );
          }
        }
      }
    }
    
    const result = await pool.query(
      `UPDATE quote_items SET 
        part_number = COALESCE($1, part_number),
        description = COALESCE($2, description),
        quantity = COALESCE($3, quantity),
        unit_price = COALESCE($4, unit_price),
        line_total = COALESCE($5, line_total),
        is_taxable = COALESCE($6, is_taxable),
        stair_config_id = COALESCE($7, stair_config_id)
       WHERE id = $8 RETURNING *`,
      [finalPartNumber, description, quantity, unit_price, lineTotal, is_taxable, stairConfigId, itemId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote item not found' });
    }
    
    // Recalculate job totals
    const jobResult = await pool.query('SELECT job_item_id as job_id FROM quote_items WHERE id = $1', [itemId]);
    if (jobResult.rows.length > 0) {
      const jobId = jobResult.rows[0].job_id;
      const totals = await calculateJobTotals(jobId);
      await pool.query(
        'UPDATE job_items SET subtotal = $1, labor_total = $2, tax_amount = $3, total_amount = $4 WHERE id = $5',
        [totals.subtotal, totals.laborTotal, totals.taxAmount, totals.total, jobId]
      );
      
      // Invalidate PDF cache for this job
      console.log(`UPDATE: Invalidating PDF cache for job ${jobId} after stair config update`);
      await pdfCache.invalidateJob(jobId);
      console.log(`UPDATE: PDF cache invalidated successfully for job ${jobId}`);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteQuoteItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    
    // Get job_id before deletion
    const jobResult = await pool.query('SELECT job_item_id as job_id FROM quote_items WHERE id = $1', [itemId]);
    
    const result = await pool.query('DELETE FROM quote_items WHERE id = $1 RETURNING *', [itemId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote item not found' });
    }
    
    // Recalculate job totals
    if (jobResult.rows.length > 0) {
      const jobId = jobResult.rows[0].job_id;
      const totals = await calculateJobTotals(jobId);
      await pool.query(
        'UPDATE job_items SET subtotal = $1, labor_total = $2, tax_amount = $3, total_amount = $4 WHERE id = $5',
        [totals.subtotal, totals.laborTotal, totals.taxAmount, totals.total, jobId]
      );
      
      // Invalidate PDF cache for this job
      await pdfCache.invalidateJob(jobId);
    }
    
    res.json({ message: 'Quote item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// PDF Generation
export const generateJobPDFEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { showLinePricing } = req.query;
    
    // Parse the showLinePricing parameter, default to true
    const showPricing = showLinePricing !== 'false';
    
    // Get basic job info for filename
    const jobResult = await pool.query(`
      SELECT j.id, j.status, c.name as customer_name, p.name as project_name
      FROM job_items j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      LEFT JOIN jobs p ON j.job_id = p.id
      WHERE j.id = $1
    `, [id]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const jobData = jobResult.rows[0];
    const filename = getJobPDFFilename(jobData);

    // Generate PDF with pricing parameter
    const pdfBuffer = await generateJobPDF(parseInt(id!), showPricing);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// Clear PDF Cache
export const clearPDFCacheEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    
    if (jobId) {
      // Clear cache for specific job
      await pdfCache.invalidateJob(parseInt(jobId));
      console.log(`Manual cache clear for job ${jobId}`);
      res.json({ message: `PDF cache cleared for job ${jobId}` });
    } else {
      // Clear entire cache
      await pdfCache.clearAll();
      console.log('Manual cache clear for all jobs');
      res.json({ message: 'All PDF cache cleared' });
    }
  } catch (error) {
    console.error('Error clearing PDF cache:', error);
    res.status(500).json({ error: 'Failed to clear PDF cache' });
  }
};
