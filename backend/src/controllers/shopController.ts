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
    const { id } = req.params;
    const shop = await shopService.getShopById(parseInt(id));
    res.json(shop);
  } catch (error: any) {
    if (error.message === 'Shop not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const createShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { job_id, cut_sheets, notes } = req.body;
    
    const result = await pool.query(
      `INSERT INTO shops (job_id, cut_sheets, notes) 
       VALUES ($1, $2, $3) RETURNING *`,
      [job_id, JSON.stringify(cut_sheets), notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { job_id, cut_sheets, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE shops SET job_id = $1, cut_sheets = $2, notes = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [job_id, JSON.stringify(cut_sheets), notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM shops WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
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
    if (error.message.includes('No stair configurations found')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

export const updateShopStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['generated', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    await shopService.updateShopStatus(parseInt(id), status);
    res.json({ message: 'Shop status updated successfully' });
  } catch (error: any) {
    next(error);
  }
};

// PDF generation endpoints
export const downloadShopPaper = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const shopId = parseInt(id);

    const pdfBuffer = await generateShopPaper(shopId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ShopPaper_${shopId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    if (error.message === 'Shop not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const downloadCutList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const shopId = parseInt(id);

    const pdfBuffer = await generateCutList(shopId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CutList_${shopId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    if (error.message === 'Shop not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};