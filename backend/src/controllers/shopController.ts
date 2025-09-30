import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import * as shopService from '../services/shopService';
import { generateShopPaper, generateCutList } from '../services/pdfService';

export const getAllShops = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shops = await shopService.getAllShops();
    res.json(shops);
  } catch (error) {
    next(error);
  }
};

export const getShopById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawShopId = req.params.id;
    if (typeof rawShopId !== 'string') {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const shopId = Number.parseInt(rawShopId, 10);

    if (!Number.isInteger(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const shop = await shopService.getShopById(shopId);
    res.json(shop);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Shop not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const createShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { job_id, cut_sheets, notes } = req.body;
    const jobId = typeof job_id === 'string' ? Number.parseInt(job_id, 10) : Number(job_id);

    if (!Number.isInteger(jobId)) {
      return res.status(400).json({ error: 'job_id must be a valid number' });
    }

    const cutSheetsJson = cut_sheets ? JSON.stringify(cut_sheets) : null;
    const notesValue = typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null;
    
    const result = await pool.query(
      `INSERT INTO shops (job_id, cut_sheets, notes) 
       VALUES ($1, $2, $3) RETURNING *`,
      [jobId, cutSheetsJson, notesValue]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawShopId = req.params.id;
    if (typeof rawShopId !== 'string') {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const shopId = Number.parseInt(rawShopId, 10);
    if (!Number.isInteger(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }
    const { job_id, cut_sheets, notes } = req.body;
    const jobId = typeof job_id === 'string' ? Number.parseInt(job_id, 10) : Number(job_id);

    if (!Number.isInteger(jobId)) {
      return res.status(400).json({ error: 'job_id must be a valid number' });
    }

    const cutSheetsJson = cut_sheets ? JSON.stringify(cut_sheets) : null;
    const notesValue = typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null;
    
    const result = await pool.query(
      `UPDATE shops SET job_id = $1, cut_sheets = $2, notes = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [jobId, cutSheetsJson, notesValue, shopId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawShopId = req.params.id;
    if (typeof rawShopId !== 'string') {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const shopId = Number.parseInt(rawShopId, 10);

    if (!Number.isInteger(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const result = await pool.query('DELETE FROM shops WHERE id = $1 RETURNING id', [shopId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json({ message: 'Shop deleted successfully' });
  } catch (error: unknown) {
    next(error);
  }
};

// New shop generation endpoints
export const getAvailableOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = req.query.filter as 'all' | 'unrun' || 'all';
    const orders = await shopService.getAvailableOrders(filter);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const generateShops = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'orderIds is required and must be a non-empty array' });
    }

    const shop = await shopService.generateCutSheets(orderIds);
    res.status(201).json(shop);
  } catch (error: any) {
    const msg = typeof error?.message === 'string' ? error.message : '';
    if (msg.includes('No stair configurations found') || msg.includes('No quoted stair configurations found')) {
      return res.status(400).json({ error: msg });
    }
    next(error);
  }
};

export const updateShopStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawShopId = req.params.id;
    if (typeof rawShopId !== 'string') {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const shopId = Number.parseInt(rawShopId, 10);
    if (!Number.isInteger(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }
    const { status } = req.body;
    
    const validStatuses = ['generated', 'in_progress', 'completed'];
    if (typeof status !== 'string' || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    await shopService.updateShopStatus(shopId, status);
    res.json({ message: 'Shop status updated successfully' });
  } catch (error: unknown) {
    next(error);
  }
};

// PDF generation endpoints
export const downloadShopPaper = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawShopId = req.params.id;
    if (typeof rawShopId !== 'string') {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const shopId = Number.parseInt(rawShopId, 10);

    if (!Number.isInteger(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const pdfBuffer = await generateShopPaper(shopId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ShopPaper_${shopId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Shop not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const downloadCutList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawShopId = req.params.id;
    if (typeof rawShopId !== 'string') {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const shopId = Number.parseInt(rawShopId, 10);

    if (!Number.isInteger(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const pdfBuffer = await generateCutList(shopId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CutList_${shopId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Shop not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};
