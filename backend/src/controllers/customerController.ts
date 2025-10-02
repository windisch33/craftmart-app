import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

export const getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recent } = req.query as Record<string, string | undefined>;
    const pageParam = (req.query as any).page;
    const pageSizeParam = (req.query as any).pageSize || (req.query as any).page_size || (req.query as any).limit;
    const sortBy = ((req.query as any).sortBy || 'name').toString();
    const sortDir = ((req.query as any).sortDir || 'asc').toString().toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const stateFilter = (req.query as any).state ? String((req.query as any).state) : undefined;
    const hasEmail = (req.query as any).hasEmail ? String((req.query as any).hasEmail).toLowerCase() === 'true' : undefined;
    
    let query: string;
    let params: any[] = [];
    
    if (recent === 'true') {
      // Get last 10 visited customers (no is_active column in current schema)
      query = `
        SELECT * FROM customers 
        WHERE last_visited_at IS NOT NULL
        ORDER BY last_visited_at DESC 
        LIMIT 10
      `;
      const result = await pool.query(query, params);
      return res.json(result.rows);
    } else if (pageParam || pageSizeParam) {
      // Paginated list
      const page = Math.max(1, Number.parseInt(String(pageParam || '1'), 10));
      const pageSizeRaw = Math.max(1, Number.parseInt(String(pageSizeParam || '25'), 10));
      const pageSize = Math.min(100, pageSizeRaw);

      const where: string[] = [];
      if (stateFilter) { params.push(stateFilter.toUpperCase()); where.push(`state = $${params.length}`); }
      if (hasEmail !== undefined) {
        if (hasEmail) { where.push("(email IS NOT NULL AND email <> '')"); }
        else { where.push("(email IS NULL OR email = '')"); }
      }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      // Count
      const countSql = `SELECT COUNT(*) AS cnt FROM customers ${whereSql}`;
      const countRes = await pool.query(countSql, params);
      const total = Number(countRes.rows[0]?.cnt || 0);
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const offset = (page - 1) * pageSize;

      const allowedSort = sortBy === 'created_at' ? 'created_at' : 'name';
      const listSql = `SELECT * FROM customers ${whereSql} ORDER BY ${allowedSort} ${sortDir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      const listRes = await pool.query(listSql, [...params, pageSize, offset]);
      return res.json({ data: listRes.rows, page, pageSize, total, totalPages });
    } else {
      // Default to all customers ordered by name
      query = 'SELECT * FROM customers ORDER BY name ASC';
      const result = await pool.query(query, params);
      return res.json(result.rows);
    }
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // Update last_visited_at timestamp (no-op if archived)
    await pool.query('UPDATE customers SET last_visited_at = NOW() WHERE id = $1 AND is_active = TRUE', [id]);
    
    // Get the updated customer data
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address, city, state, zip_code, phone, mobile, fax, email, accounting_email, notes } = req.body;
    const normalized = {
      name: name?.trim(),
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state ? String(state).toUpperCase() : null,
      zip_code: zip_code?.trim() || null,
      phone: phone?.trim() || null,
      mobile: mobile?.trim() || null,
      fax: fax?.trim() || null,
      email: email ? String(email).toLowerCase() : null,
      accounting_email: accounting_email ? String(accounting_email).toLowerCase() : null,
      notes: notes?.trim() || null,
    };
    
    const result = await pool.query(
      `INSERT INTO customers (name, address, city, state, zip_code, phone, mobile, fax, email, accounting_email, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        normalized.name,
        normalized.address,
        normalized.city,
        normalized.state,
        normalized.zip_code,
        normalized.phone,
        normalized.mobile,
        normalized.fax,
        normalized.email,
        normalized.accounting_email,
        normalized.notes
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, zip_code, phone, mobile, fax, email, accounting_email, notes } = req.body;
    const normalized = {
      name: name?.trim(),
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state ? String(state).toUpperCase() : null,
      zip_code: zip_code?.trim() || null,
      phone: phone?.trim() || null,
      mobile: mobile?.trim() || null,
      fax: fax?.trim() || null,
      email: email ? String(email).toLowerCase() : null,
      accounting_email: accounting_email ? String(accounting_email).toLowerCase() : null,
      notes: notes?.trim() || null,
    };
    
    const result = await pool.query(
      `UPDATE customers SET name = $1, address = $2, city = $3, state = $4, zip_code = $5, 
       phone = $6, mobile = $7, fax = $8, email = $9, accounting_email = $10, notes = $11, updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [
        normalized.name,
        normalized.address,
        normalized.city,
        normalized.state,
        normalized.zip_code,
        normalized.phone,
        normalized.mobile,
        normalized.fax,
        normalized.email,
        normalized.accounting_email,
        normalized.notes,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query('UPDATE customers SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer archived successfully' });
  } catch (error) {
    next(error);
  }
};

export const searchCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query as Record<string, string | undefined>;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.json([]);
    }
    
    const searchTerm = q.trim();
    const limitParam = (req.query as any).limit;
    const pageParam = (req.query as any).page;
    const limitRaw = limitParam ? Number.parseInt(String(limitParam), 10) : 50;
    const limit = Math.min(100, Math.max(1, limitRaw));
    const page = Math.max(1, Number.parseInt(String(pageParam || '1'), 10));
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM customers 
      WHERE ( 
        name ILIKE $1 OR
        email ILIKE $1 OR
        city ILIKE $1 OR
        state ILIKE $1
      )
      ORDER BY 
        CASE 
          WHEN name ILIKE $2 THEN 1
          WHEN name ILIKE $1 THEN 2
          ELSE 3
        END,
        name ASC
      LIMIT $3 OFFSET $4
    `;
    const result = await pool.query(query, [`%${searchTerm}%`, `${searchTerm}%`, limit, offset]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};
