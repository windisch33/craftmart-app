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
      WHERE job_id = $1
    `, [jobId]);

    const jobResult = await pool.query('SELECT tax_rate FROM jobs WHERE id = $1', [jobId]);
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
             c.name as customer_name, c.state as customer_state,
             s.first_name as salesman_first_name, s.last_name as salesman_last_name,
             (s.first_name || ' ' || s.last_name) as salesman_name
      FROM jobs j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      LEFT JOIN salesmen s ON j.salesman_id = s.id
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

    // Amount range filter
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

      if (amountRangeMin !== undefined && parseFloat(amountRangeMin.toString()) > 0) {
        conditions.push(`${amountField} >= $${queryParams.length + 1}`);
        queryParams.push(parseFloat(amountRangeMin.toString()));
      }

      if (amountRangeMax !== undefined && parseFloat(amountRangeMax.toString()) > 0) {
        conditions.push(`${amountField} <= $${queryParams.length + 1}`);
        queryParams.push(parseFloat(amountRangeMax.toString()));
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
               c.name as customer_name, c.state as customer_state,
               s.first_name as salesman_first_name, s.last_name as salesman_last_name,
               (s.first_name || ' ' || s.last_name) as salesman_name
        FROM jobs j 
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
             s.email as salesman_email, s.phone as salesman_phone
      FROM jobs j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      LEFT JOIN salesmen s ON j.salesman_id = s.id
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
             c.name as customer_name, c.address, c.city, c.state, c.zip_code,
             c.phone, c.mobile, c.email, c.accounting_email,
             s.first_name as salesman_first_name, s.last_name as salesman_last_name,
             s.email as salesman_email, s.phone as salesman_phone
      FROM jobs j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      LEFT JOIN salesmen s ON j.salesman_id = s.id
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
                 'quantity', qi.quantity,
                 'unit_price', qi.unit_price,
                 'line_total', qi.line_total,
                 'is_taxable', qi.is_taxable
               ) ORDER BY qi.created_at
             ) FILTER (WHERE qi.id IS NOT NULL), '[]') as items
      FROM job_sections js
      LEFT JOIN quote_items qi ON js.id = qi.section_id
      WHERE js.job_id = $1
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
      customer_id, salesman_id, title, description, status = 'quote',
      delivery_date, job_location, order_designation, model_name, installer, terms,
      show_line_pricing = true
    } = req.body;
    
    if (!customer_id || !title) {
      return res.status(400).json({ error: 'Customer ID and title are required' });
    }

    // Get customer state for tax calculation
    const customerResult = await pool.query('SELECT state FROM customers WHERE id = $1', [customer_id]);
    if (customerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    const customerState = customerResult.rows[0].state;
    const taxRate = customerState ? await calculateTaxForState(customerState) : 0;
    
    const result = await pool.query(
      `INSERT INTO jobs (
        customer_id, salesman_id, title, description, status,
        delivery_date, job_location, order_designation, model_name, installer, terms,
        show_line_pricing, tax_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [customer_id, salesman_id, title, description, status,
       delivery_date, job_location, order_designation, model_name, installer, terms,
       show_line_pricing, taxRate]
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
      'customer_id', 'salesman_id', 'title', 'description', 'status',
      'delivery_date', 'job_location', 'order_designation', 'model_name', 
      'installer', 'terms', 'show_line_pricing'
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
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.push('updated_at = NOW()');
    values.push(id);
    
    const query = `UPDATE jobs SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Recalculate totals
    const totals = await calculateJobTotals(parseInt(id!));
    await pool.query(
      'UPDATE jobs SET subtotal = $1, labor_total = $2, tax_amount = $3, total_amount = $4 WHERE id = $5',
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
    const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING id', [id]);
    
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
      'SELECT * FROM job_sections WHERE job_id = $1 ORDER BY display_order, id',
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
    const { name, description, display_order = 0, is_labor_section = false, is_misc_section = false } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Section name is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO job_sections (job_id, name, description, display_order, is_labor_section, is_misc_section) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [jobId, name, description, display_order, is_labor_section, is_misc_section]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateJobSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;
    const { name, description, display_order, is_labor_section, is_misc_section } = req.body;
    
    const result = await pool.query(
      `UPDATE job_sections SET 
        name = COALESCE($1, name), 
        description = COALESCE($2, description),
        display_order = COALESCE($3, display_order),
        is_labor_section = COALESCE($4, is_labor_section),
        is_misc_section = COALESCE($5, is_misc_section),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, description, display_order, is_labor_section, is_misc_section, sectionId]
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
    const { part_number, description, quantity = 1, unit_price = 0, is_taxable = true } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    const lineTotal = quantity * unit_price;
    
    const result = await pool.query(
      `INSERT INTO quote_items (
        job_id, section_id, part_number, description, quantity, unit_price, line_total, is_taxable,
        product_type, product_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [jobId, sectionId, part_number, description, quantity, unit_price, lineTotal, is_taxable, 'custom', description]
    );
    
    // Recalculate job totals
    const totals = await calculateJobTotals(parseInt(jobId!));
    await pool.query(
      'UPDATE jobs SET subtotal = $1, labor_total = $2, tax_amount = $3, total_amount = $4 WHERE id = $5',
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
    const { part_number, description, quantity, unit_price, is_taxable } = req.body;
    
    // Calculate new line total if quantity or unit_price changed
    let lineTotal: number | undefined;
    if (quantity !== undefined && unit_price !== undefined) {
      lineTotal = quantity * unit_price;
    }
    
    const result = await pool.query(
      `UPDATE quote_items SET 
        part_number = COALESCE($1, part_number),
        description = COALESCE($2, description),
        quantity = COALESCE($3, quantity),
        unit_price = COALESCE($4, unit_price),
        line_total = COALESCE($5, line_total),
        is_taxable = COALESCE($6, is_taxable)
       WHERE id = $7 RETURNING *`,
      [part_number, description, quantity, unit_price, lineTotal, is_taxable, itemId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote item not found' });
    }
    
    // Recalculate job totals
    const jobResult = await pool.query('SELECT job_id FROM quote_items WHERE id = $1', [itemId]);
    if (jobResult.rows.length > 0) {
      const jobId = jobResult.rows[0].job_id;
      const totals = await calculateJobTotals(jobId);
      await pool.query(
        'UPDATE jobs SET subtotal = $1, labor_total = $2, tax_amount = $3, total_amount = $4 WHERE id = $5',
        [totals.subtotal, totals.laborTotal, totals.taxAmount, totals.total, jobId]
      );
      
      // Invalidate PDF cache for this job
      await pdfCache.invalidateJob(jobId);
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
    const jobResult = await pool.query('SELECT job_id FROM quote_items WHERE id = $1', [itemId]);
    
    const result = await pool.query('DELETE FROM quote_items WHERE id = $1 RETURNING *', [itemId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote item not found' });
    }
    
    // Recalculate job totals
    if (jobResult.rows.length > 0) {
      const jobId = jobResult.rows[0].job_id;
      const totals = await calculateJobTotals(jobId);
      await pool.query(
        'UPDATE jobs SET subtotal = $1, labor_total = $2, tax_amount = $3, total_amount = $4 WHERE id = $5',
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
      SELECT j.id, j.status, c.name as customer_name
      FROM jobs j 
      LEFT JOIN customers c ON j.customer_id = c.id 
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