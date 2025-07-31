import puppeteer from 'puppeteer';
import { browserPool } from './browserPool';
import { pdfCache } from './pdfCache';
import pool from '../config/database';
import path from 'path';

interface JobData {
  id: number;
  title: string;
  description: string;
  status: string;
  delivery_date: string;
  job_location: string;
  order_designation: string;
  model_name: string;
  installer: string;
  terms: string;
  show_line_pricing: boolean;
  subtotal: number;
  labor_total: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  
  // Customer info
  customer_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  mobile: string;
  email: string;
  accounting_email: string;
  
  // Salesman info
  salesman_first_name: string;
  salesman_last_name: string;
  salesman_email: string;
  salesman_phone: string;
  
  // Sections with items
  sections: Array<{
    id: number;
    name: string;
    description: string;
    is_labor_section: boolean;
    is_misc_section: boolean;
    items: Array<{
      id: number;
      part_number: string;
      description: string;
      quantity: number;
      unit_price: number;
      line_total: number;
      is_taxable: boolean;
    }>;
  }>;
}

const generateJobPDFHTML = (jobData: JobData, showLinePricing: boolean = true): string => {
  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = parseFloat(String(amount || 0));
    return `$${(isNaN(numAmount) ? 0 : numAmount).toFixed(2)}`;
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const salesmanName = jobData.salesman_first_name && jobData.salesman_last_name 
    ? `${jobData.salesman_first_name} ${jobData.salesman_last_name}`
    : 'Not Assigned';

  const statusLabel = jobData.status.toUpperCase();
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CraftMart ${statusLabel} - ${jobData.id}</title>
    <style>
        @page {
            margin: 0.5in;
            size: letter;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.2;
            color: #333;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 15px;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .company-details {
            color: #6b7280;
            line-height: 1.4;
        }
        
        .status-box {
            border: 2px solid #3b82f6;
            padding: 8px 16px;
            text-align: center;
            min-width: 100px;
        }
        
        .status-label {
            font-size: 14px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 4px;
        }
        
        .order-number {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .job-info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .customer-info, .job-details {
            flex: 1;
            margin-right: 20px;
        }
        
        .job-details {
            margin-right: 0;
        }
        
        .section-title {
            font-weight: bold;
            font-size: 12px;
            color: #1f2937;
            margin-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 3px;
        }
        
        .info-label {
            font-weight: bold;
            min-width: 80px;
            color: #374151;
        }
        
        .info-value {
            flex: 1;
            color: #6b7280;
        }
        
        .metadata-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            border: 1px solid #d1d5db;
        }
        
        .metadata-table th, .metadata-table td {
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            text-align: left;
            font-size: 10px;
        }
        
        .metadata-table th {
            background-color: #f9fafb;
            font-weight: bold;
        }
        
        .model-name {
            background-color: #f3f4f6;
            padding: 8px;
            margin-bottom: 15px;
            border: 1px solid #d1d5db;
            font-weight: bold;
            text-align: center;
        }
        
        .section-header {
            background-color: #f8fafc;
            padding: 8px;
            margin-top: 15px;
            margin-bottom: 5px;
            border-left: 4px solid #3b82f6;
            font-weight: bold;
            font-size: 12px;
            color: #1f2937;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .items-table th, .items-table td {
            border: 1px solid #e5e7eb;
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
            font-size: 10px;
        }
        
        .items-table th {
            background-color: #f9fafb;
            font-weight: bold;
        }
        
        .qty-col { width: 40px; text-align: center; }
        .part-col { width: 120px; }
        .desc-col { flex: 1; }
        .price-col { width: 80px; text-align: right; }
        
        .totals-section {
            margin-top: 20px;
            border-top: 2px solid #3b82f6;
            padding-top: 15px;
        }
        
        .totals-table {
            width: 100%;
            max-width: 400px;
            margin-left: auto;
            border-collapse: collapse;
        }
        
        .totals-table td {
            padding: 6px 12px;
            border: 1px solid #e5e7eb;
            font-size: 11px;
        }
        
        .totals-label {
            font-weight: bold;
            background-color: #f9fafb;
            text-align: right;
            width: 60%;
        }
        
        .totals-value {
            text-align: right;
            width: 40%;
        }
        
        .total-row {
            font-weight: bold;
            background-color: #f3f4f6;
        }
        
        .total-row td {
            border-top: 2px solid #3b82f6;
            font-size: 12px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 9px;
        }
        
        @media print {
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="company-info">
            <div class="company-name">Craft-Mart Inc.</div>
            <div class="company-details">
                5035 Allendale Lane<br>
                Taneytown &nbsp;&nbsp;&nbsp;&nbsp; MD &nbsp;&nbsp;&nbsp;&nbsp; 21787-2100<br>
                Phone (410) 751-9467 &nbsp;&nbsp;&nbsp;&nbsp; FAX # (410) 751-9469<br>
                www.craftmartstairs.com
            </div>
        </div>
        <div class="status-box">
            <div class="status-label">${statusLabel}</div>
            <div class="order-number">${statusLabel} # ${jobData.id}</div>
        </div>
    </div>

    <!-- Job Info Section -->
    <div class="job-info-section">
        <div class="customer-info">
            <div class="section-title">Customer:</div>
            <div><strong>${jobData.customer_name}</strong></div>
            ${jobData.address ? `<div>${jobData.address}</div>` : ''}
            <div>${jobData.city ? jobData.city + ', ' : ''}${jobData.state || ''} ${jobData.zip_code || ''}</div>
            ${jobData.phone ? `<div>Office# ${jobData.phone}</div>` : ''}
            ${jobData.mobile ? `<div>Mobile# ${jobData.mobile}</div>` : ''}
            ${jobData.email ? `<div>Email: ${jobData.email}</div>` : ''}
        </div>
        
        <div class="job-details">
            <div class="section-title">Job: ${jobData.title}</div>
            ${jobData.job_location ? `<div><strong>Directions:</strong><br>${jobData.job_location}</div>` : ''}
        </div>
    </div>

    <!-- Metadata Table -->
    <table class="metadata-table">
        <tr>
            <th>Sales Rep.</th>
            <th>Contact Person</th>
            <th>Print Date</th>
        </tr>
        <tr>
            <td>${salesmanName}</td>
            <td>${jobData.customer_name.split(' ')[0] || 'CUSTOMER'}</td>
            <td>${formatDate(new Date().toISOString())}</td>
        </tr>
        <tr>
            <th>Delivery Date</th>
            <th>Oak Delivery Date</th>
            <th>Order Designation</th>
        </tr>
        <tr>
            <td>${jobData.delivery_date ? formatDate(jobData.delivery_date) : ''}</td>
            <td>/ /</td>
            <td>${jobData.order_designation || 'INSTALL'}</td>
        </tr>
    </table>

    ${jobData.model_name ? `<div class="model-name">Model Name: ${jobData.model_name}</div>` : ''}

    <!-- Sections and Items -->
    ${jobData.sections.map(section => `
        <div class="section-header">Location: ${section.name}</div>
        ${section.items.length > 0 ? `
        <table class="items-table">
            <thead>
                <tr>
                    <th class="qty-col">Qty</th>
                    <th class="part-col">Part Number</th>
                    <th class="desc-col">Description</th>
                    ${showLinePricing ? '<th class="price-col">Price</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${section.items.map(item => `
                <tr>
                    <td class="qty-col">${item.quantity}</td>
                    <td class="part-col">${item.part_number || ''}</td>
                    <td class="desc-col">${item.description}</td>
                    ${showLinePricing ? `<td class="price-col">${formatCurrency(item.line_total)}</td>` : ''}
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<div style="margin-bottom: 15px; color: #6b7280; font-style: italic;">No items in this section</div>'}
    `).join('')}

    <!-- Totals Section -->
    <div class="totals-section">
        <table class="totals-table">
            <tr>
                <td class="totals-label">Parts w/ Applicable taxes (if any)</td>
                <td class="totals-value">${formatCurrency(jobData.subtotal || 0)}</td>
            </tr>
            <tr>
                <td class="totals-label">Non-Tax Total</td>
                <td class="totals-value">${formatCurrency(jobData.labor_total || 0)}</td>
            </tr>
            <tr class="total-row">
                <td class="totals-label">Total</td>
                <td class="totals-value">${formatCurrency(jobData.total_amount || 0)}</td>
            </tr>
        </table>
    </div>

    <!-- Footer -->
    <div class="footer">
        Generated by CraftMart Management System - ${new Date().toLocaleString()}
    </div>
</body>
</html>
  `;
};

export const generateJobPDF = async (jobId: number, showLinePricing: boolean = true): Promise<Buffer> => {
  const startTime = Date.now();
  
  try {
    // First, get job updated timestamp for cache validation
    const timestampResult = await pool.query('SELECT updated_at FROM jobs WHERE id = $1', [jobId]);
    if (timestampResult.rows.length === 0) {
      throw new Error('Job not found');
    }
    
    const jobUpdatedAt = timestampResult.rows[0].updated_at.toISOString();
    
    // Check cache first
    const cachedPDF = await pdfCache.get(jobId, showLinePricing, jobUpdatedAt);
    if (cachedPDF) {
      console.log(`PDF cache hit for job ${jobId} (${Date.now() - startTime}ms)`);
      return cachedPDF;
    }
    
    console.log(`PDF cache miss for job ${jobId}, generating new PDF...`);
    // Get job data with simplified separate queries for better debugging
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
    `, [jobId]);

    if (jobResult.rows.length === 0) {
      throw new Error('Job not found');
    }

    // Get sections with their items
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
      GROUP BY js.id, js.job_id, js.name, js.description, js.display_order, js.is_labor_section, js.is_misc_section, js.created_at, js.updated_at
      ORDER BY js.display_order, js.id
    `, [jobId]);

    const jobData: JobData = {
      ...jobResult.rows[0],
      sections: sectionsResult.rows
    };

    if (!jobData) {
      throw new Error('Job not found');
    }

    // Generate HTML
    const html = generateJobPDFHTML(jobData, showLinePricing);

    // Get browser from pool and generate PDF
    const browser = await browserPool.getBrowser();
    let page;
    
    try {
      page = await browser.newPage();
      
      // Optimize page settings for faster rendering
      await page.setViewport({ width: 1200, height: 1600 });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        preferCSSPageSize: false
      });

      const finalBuffer = Buffer.from(pdfBuffer);
      
      // Cache the generated PDF
      await pdfCache.set(jobId, showLinePricing, jobUpdatedAt, finalBuffer);
      
      console.log(`PDF generated for job ${jobId} (${Date.now() - startTime}ms)`);
      return finalBuffer;
    } finally {
      // Always close the page and release the browser back to the pool
      if (page) {
        await page.close();
      }
      browserPool.releaseBrowser(browser);
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const getJobPDFFilename = (jobData: { id: number; status: string; customer_name: string }): string => {
  const status = jobData.status.toUpperCase();
  const customerName = jobData.customer_name.replace(/[^a-zA-Z0-9]/g, '_');
  return `CraftMart_${status}_${jobData.id}_${customerName}.pdf`;
};