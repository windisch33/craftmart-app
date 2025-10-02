import { Request, Response, NextFunction } from 'express';
import { getSalesByMonth, getSalesBySalesman, getSalesByCustomer } from '../services/reports/data/salesQueries';
import { getTaxByState } from '../services/reports/data/taxQueries';
import { getUnpaid, getAging } from '../services/reports/data/arQueries';
import pool from '../config/database';
import { sendCsv, toCsv } from '../services/reports/format/csv';
import { config } from '../config/env';
import { browserPool } from '../services/browserPool';

// Helpers
function parseDateRange(req: Request): { start: string; end: string } {
  const { start, end, month } = req.query as Record<string, string | undefined>;
  if (month) {
    const parts = month.split('-');
    const y = parts[0] ? parseInt(parts[0], 10) : NaN;
    const m = parts[1] ? parseInt(parts[1], 10) : NaN;
    if (!Number.isFinite(y) || !Number.isFinite(m)) {
      throw new Error('Invalid month format, expected YYYY-MM');
    }
    const startD = new Date(Date.UTC(y, m - 1, 1));
    const endD = new Date(Date.UTC(y, m, 0));
    return { start: toISO(startD), end: toISO(endD) };
  }
  if (!start || !end) {
    throw new Error('Missing start/end or month');
  }
  return { start, end };
}

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

// Sales: by-month
export const salesByMonth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = parseDateRange(req);
    const p: any = { start, end };
    if (req.query.salesmanId) p.salesmanId = Number(req.query.salesmanId);
    if (req.query.customerId) p.customerId = Number(req.query.customerId);
    if (req.query.state) p.state = String(req.query.state);
    const rows = await getSalesByMonth(p);

    const exportParam = String((req.query as any).export || (req.query as any).format || (req.query as any).download || '').toLowerCase();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[reports] invoices exportParam =', exportParam);
    }
    if (exportParam === 'csv') {
      const csv = toCsv(rows, [
        { key: 'month', header: 'month' },
        { key: 'invoices', header: 'invoices' },
        { key: 'subtotal', header: 'subtotal' },
        { key: 'tax', header: 'tax' },
        { key: 'total', header: 'total' },
      ]);
      const fname = `sales_by_month_${start}_to_${end}.csv`;
      return sendCsv(res, fname, csv);
    }

    res.json(rows);
  } catch (err) { next(err); }
};

export const salesBySalesman = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = parseDateRange(req);
    const p: any = { start, end };
    if (req.query.state) p.state = String(req.query.state);
    if (req.query.customerId) p.customerId = Number(req.query.customerId);
    const rows = await getSalesBySalesman(p);
    const q: any = req.query;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[reports] invoices query', q);
    }
    const exportParam = String(q.export || q.format || q.download || '').toLowerCase();
    if (exportParam === 'csv') {
      const csv = toCsv(rows, [
        { key: 'key_id', header: 'salesman_id' },
        { key: 'key_name', header: 'salesman_name' },
        { key: 'invoices', header: 'invoices' },
        { key: 'subtotal', header: 'subtotal' },
        { key: 'tax', header: 'tax' },
        { key: 'total', header: 'total' },
        { key: 'avg_invoice', header: 'avg_invoice' },
        { key: 'last_invoice_date', header: 'last_invoice_date' },
      ]);
      return sendCsv(res, `sales_by_salesman_${start}_to_${end}.csv`, csv);
    }

    res.json(rows);
  } catch (err) { next(err); }
};

export const salesByCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = parseDateRange(req);
    const p: any = { start, end };
    if (req.query.state) p.state = String(req.query.state);
    if (req.query.salesmanId) p.salesmanId = Number(req.query.salesmanId);
    const rows = await getSalesByCustomer(p);
    const exportParam = String(req.query.export || '').toLowerCase();
    if (exportParam === 'csv') {
      const csv = toCsv(rows, [
        { key: 'key_id', header: 'customer_id' },
        { key: 'key_name', header: 'customer_name' },
        { key: 'invoices', header: 'invoices' },
        { key: 'subtotal', header: 'subtotal' },
        { key: 'tax', header: 'tax' },
        { key: 'total', header: 'total' },
        { key: 'avg_invoice', header: 'avg_invoice' },
        { key: 'last_invoice_date', header: 'last_invoice_date' },
      ]);
      return sendCsv(res, `sales_by_customer_${start}_to_${end}.csv`, csv);
    }
    res.json(rows);
  } catch (err) { next(err); }
};

export const taxByState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = parseDateRange(req);
    const rows = await getTaxByState({ start, end });
    if (String(req.query.export).toLowerCase() === 'csv') {
      const csv = toCsv(rows, [
        { key: 'state', header: 'state' },
        { key: 'invoices', header: 'invoices' },
        { key: 'taxable', header: 'taxable' },
        { key: 'non_taxable_labor', header: 'non_taxable_labor' },
        { key: 'tax', header: 'tax' },
        { key: 'effective_rate', header: 'effective_rate' },
      ]);
      return sendCsv(res, `tax_by_state_${start}_to_${end}.csv`, csv);
    }
    res.json(rows);
  } catch (err) { next(err); }
};

export const arUnpaid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asOf = (req.query.asOf as string) || new Date().toISOString().slice(0, 10);
    const p: any = { asOf };
    if (req.query.issuedStart) p.issuedStart = String(req.query.issuedStart);
    if (req.query.issuedEnd) p.issuedEnd = String(req.query.issuedEnd);
    if (req.query.salesmanId) p.salesmanId = Number(req.query.salesmanId);
    if (req.query.customerId) p.customerId = Number(req.query.customerId);
    if (req.query.state) p.state = String(req.query.state);
    const rows = await getUnpaid(p);
    if (String(req.query.export).toLowerCase() === 'csv') {
      const csv = toCsv(rows, [
        { key: 'invoice_id', header: 'invoice_id' },
        { key: 'invoice_number', header: 'invoice_number' },
        { key: 'order_id', header: 'order_id' },
        { key: 'order_number', header: 'order_number' },
        { key: 'po_number', header: 'po_number' },
        { key: 'job_title', header: 'job_title' },
        { key: 'customer_id', header: 'customer_id' },
        { key: 'customer_name', header: 'customer_name' },
        { key: 'salesman_id', header: 'salesman_id' },
        { key: 'salesman_name', header: 'salesman_name' },
        { key: 'invoice_date', header: 'invoice_date' },
        { key: 'due_date', header: 'due_date' },
        { key: 'amount', header: 'amount' },
        { key: 'paid', header: 'paid' },
        { key: 'balance', header: 'balance' },
      ]);
      return sendCsv(res, `ar_unpaid_${asOf}.csv`, csv);
    }
    res.json(rows);
  } catch (err) { next(err); }
};

export const arAging = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asOf = (req.query.asOf as string) || new Date().toISOString().slice(0, 10);
    const p: any = { asOf };
    if (req.query.issuedStart) p.issuedStart = String(req.query.issuedStart);
    if (req.query.issuedEnd) p.issuedEnd = String(req.query.issuedEnd);
    if (req.query.salesmanId) p.salesmanId = Number(req.query.salesmanId);
    if (req.query.customerId) p.customerId = Number(req.query.customerId);
    if (req.query.state) p.state = String(req.query.state);
    const rows = await getAging(p);
    if (String(req.query.export).toLowerCase() === 'csv') {
      const csv = toCsv(rows, [
        { key: 'customer_id', header: 'customer_id' },
        { key: 'customer_name', header: 'customer_name' },
        { key: 'current', header: 'current' },
        { key: 'd1_30', header: 'd1_30' },
        { key: 'd31_60', header: 'd31_60' },
        { key: 'd61_90', header: 'd61_90' },
        { key: 'd90_plus', header: 'd90_plus' },
        { key: 'invoices', header: 'invoices' },
        { key: 'total', header: 'total' },
      ]);
      return sendCsv(res, `ar_aging_${asOf}.csv`, csv);
    }
    res.json(rows);
  } catch (err) { next(err); }
};

// Invoice drill-downs
export const listInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = parseDateRange(req);
    const state = (req.query.state as string) || undefined;
    const salesmanId = req.query.salesmanId ? Number(req.query.salesmanId) : undefined;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const where: string[] = ['invoice_date BETWEEN $1 AND $2'];
    const values: any[] = [start, end];
    if (state) { values.push(state); where.push(`state = $${values.length}`); }
    if (salesmanId) { values.push(salesmanId); where.push(`salesman_id = $${values.length}`); }
    if (customerId) { values.push(customerId); where.push(`customer_id = $${values.length}`); }
    const sql = `SELECT invoice_id, invoice_number, order_id, order_number, po_number, job_title,
                        customer_id, customer_name, salesman_id, salesman_name,
                        invoice_date::text, due_date::text, paid_date::text,
                        subtotal, labor_total, tax_amount AS tax, total_amount AS total,
                        COALESCE(paid_amount,0) AS paid_amount,
                        (total_amount - COALESCE(paid_amount,0)) AS open_balance
                 FROM invoices_view
                 WHERE ${where.join(' AND ')}
                 ORDER BY invoice_date DESC, invoice_id DESC`;
    const { rows } = await pool.query(sql, values);
    const mapped = rows.map((r) => ({
      invoice_id: Number(r.invoice_id),
      invoice_number: r.invoice_number,
      order_id: Number(r.order_id),
      order_number: r.order_number,
      po_number: r.po_number ?? null,
      job_title: r.job_title ?? null,
      customer_id: r.customer_id != null ? Number(r.customer_id) : null,
      customer_name: r.customer_name ?? null,
      salesman_id: r.salesman_id != null ? Number(r.salesman_id) : null,
      salesman_name: r.salesman_name ?? null,
      invoice_date: r.invoice_date,
      due_date: r.due_date,
      paid_date: r.paid_date ?? null,
      subtotal: Number(r.subtotal || 0),
      labor_total: Number(r.labor_total || 0),
      tax: Number(r.tax || 0),
      total: Number(r.total || 0),
      paid_amount: Number(r.paid_amount || 0),
      open_balance: Number(r.open_balance || 0),
    }));
    const exportParam = String(req.query.export || '').toLowerCase();
    if (exportParam === 'csv') {
      const csv = toCsv(rows, [
        { key: 'invoice_id', header: 'invoice_id' },
        { key: 'invoice_number', header: 'invoice_number' },
        { key: 'order_id', header: 'order_id' },
        { key: 'order_number', header: 'order_number' },
        { key: 'po_number', header: 'po_number' },
        { key: 'job_title', header: 'job_title' },
        { key: 'customer_id', header: 'customer_id' },
        { key: 'customer_name', header: 'customer_name' },
        { key: 'salesman_id', header: 'salesman_id' },
        { key: 'salesman_name', header: 'salesman_name' },
        { key: 'invoice_date', header: 'invoice_date' },
        { key: 'due_date', header: 'due_date' },
        { key: 'paid_date', header: 'paid_date' },
        { key: 'subtotal', header: 'subtotal' },
        { key: 'labor_total', header: 'labor' },
        { key: 'tax', header: 'tax' },
        { key: 'total', header: 'total' },
        { key: 'paid_amount', header: 'paid_amount' },
        { key: 'open_balance', header: 'open_balance' },
      ]);
      return sendCsv(res, `invoices_${start}_to_${end}.csv`, csv);
    }

    if (exportParam === 'pdf') {
      const html = buildInvoicesHtml(mapped, {
        title: invoiceTitleFromQuery(req.query),
        subtitle: invoiceSubtitleFromQuery(req.query),
      });
      const browser = await browserPool.getBrowser();
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'Letter', margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }, printBackground: true });
        await page.close();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="invoices.pdf"');
        return res.end(Buffer.from(pdf));
      } finally {
        browserPool.releaseBrowser(browser);
      }
    }

    res.json(mapped);
  } catch (err) { next(err); }
};

export const getInvoiceItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = Number(req.params.invoiceId);
    // Return sectioned items summarised similar to jobController, but simpler
    const { rows } = await pool.query(
      `SELECT js.name AS section,
              qi.description AS item_description,
              qi.quantity::numeric AS quantity,
              qi.unit_price::numeric AS unit_price,
              qi.line_total::numeric AS line_total
       FROM job_sections js
       LEFT JOIN quote_items qi ON js.id = qi.section_id
       WHERE js.job_item_id = $1
       ORDER BY js.display_order, js.id, qi.id`,
      [invoiceId]
    );
    const mapped = rows.map((r) => ({
      section: r.section,
      item_description: r.item_description,
      quantity: r.quantity != null ? Number(r.quantity) : 0,
      unit_price: r.unit_price != null ? Number(r.unit_price) : 0,
      line_total: r.line_total != null ? Number(r.line_total) : 0,
    }));
    if (String(req.query.export).toLowerCase() === 'csv') {
      const csv = toCsv(rows, [
        { key: 'section', header: 'section' },
        { key: 'item_description', header: 'item_description' },
        { key: 'quantity', header: 'quantity' },
        { key: 'unit_price', header: 'unit_price' },
        { key: 'line_total', header: 'line_total' },
      ]);
      return sendCsv(res, `invoice_${invoiceId}_items.csv`, csv);
    }
    res.json(mapped);
  } catch (err) { next(err); }
};

// Dedicated PDF endpoint to avoid query-param issues in some proxies
export const listInvoicesPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = parseDateRange(req);
    const state = (req.query.state as string) || undefined;
    const salesmanId = req.query.salesmanId ? Number(req.query.salesmanId) : undefined;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const where: string[] = ['invoice_date BETWEEN $1 AND $2'];
    const values: any[] = [start, end];
    if (state) { values.push(state); where.push(`state = $${values.length}`); }
    if (salesmanId) { values.push(salesmanId); where.push(`salesman_id = $${values.length}`); }
    if (customerId) { values.push(customerId); where.push(`customer_id = $${values.length}`); }

    const sql = `SELECT invoice_id, invoice_number, po_number, customer_name,
                        invoice_date::text, due_date::text,
                        subtotal, labor_total, tax_amount AS tax, total_amount AS total,
                        COALESCE(paid_amount,0) AS paid_amount,
                        (total_amount - COALESCE(paid_amount,0)) AS open_balance
                 FROM invoices_view
                 WHERE ${where.join(' AND ')}
                 ORDER BY invoice_date DESC, invoice_id DESC`;
    const { rows } = await pool.query(sql, values);
    const mapped = rows.map((r) => ({
      invoice_number: r.invoice_number,
      po_number: r.po_number ?? '',
      customer_name: r.customer_name ?? '',
      invoice_date: r.invoice_date,
      due_date: r.due_date,
      subtotal: Number(r.subtotal || 0),
      labor_total: Number(r.labor_total || 0),
      tax: Number(r.tax || 0),
      total: Number(r.total || 0),
      paid_amount: Number(r.paid_amount || 0),
      open_balance: Number(r.open_balance || 0),
    }));

    const html = buildInvoicesHtml(mapped as any, {
      title: invoiceTitleFromQuery(req.query),
      subtitle: invoiceSubtitleFromQuery(req.query),
    });
    const browser = await browserPool.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'Letter', landscape: true, margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }, printBackground: true });
      await page.close();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="invoices.pdf"');
      return res.end(Buffer.from(pdf));
    } finally {
      browserPool.releaseBrowser(browser);
    }
  } catch (err) { next(err); }
};

function invoiceTitleFromQuery(q: any): string {
  return 'Invoices';
}

function invoiceSubtitleFromQuery(q: any): string {
  const { start, end, month, salesmanId, customerId, state } = q as Record<string, string | undefined>;
  const parts: string[] = [];
  if (month) parts.push(`Month: ${month}`);
  if (start && end) parts.push(`Range: ${start} – ${end}`);
  if (salesmanId) parts.push(`Salesman: ${salesmanId}`);
  if (customerId) parts.push(`Customer: ${customerId}`);
  if (state) parts.push(`State: ${state}`);
  return parts.join(' • ');
}

function buildInvoicesHtml(rows: any[], meta: { title: string; subtitle?: string }): string {
  const companyName = escapeHtml(config.COMPANY_NAME);
  const companyLine = escapeHtml([
    config.COMPANY_ADDRESS,
    config.COMPANY_PHONE,
    config.COMPANY_WEBSITE
  ].filter(Boolean).join(' • '));
  const header = `
    <div class="report-header">
      <div class="company">
        <div class="name">${companyName}</div>
        <div class="sub">${companyLine}</div>
      </div>
      <div class="meta">
        <div class="title">${meta.title}</div>
        ${meta.subtitle ? `<div class="subtitle">${meta.subtitle}</div>` : ''}
        <div class="generated">Generated: ${new Date().toISOString().slice(0,16).replace('T',' ')}</div>
      </div>
    </div>`;
  const headers = ['Invoice #','PO #','Customer','Invoice Date','Due Date','Subtotal','Labor','Tax','Total','Paid','Balance'];
  const thead = headers
    .map(h => `<th>${h}</th>`).join('');
  // Compute totals for numeric columns
  const sum = { subtotal:0, labor_total:0, tax:0, total:0, paid_amount:0, open_balance:0 } as any;
  const tbody = rows.map(r => `
    <tr>
      <td>${escapeHtml(r.invoice_number || '')}</td>
      <td>${escapeHtml(r.po_number || '')}</td>
      <td>${escapeHtml(r.customer_name || '')}</td>
      <td>${escapeHtml(r.invoice_date || '')}</td>
      <td>${escapeHtml(r.due_date || '')}</td>
      <td class="num">${fmt(r.subtotal)}</td>
      <td class="num">${fmt(r.labor_total)}</td>
      <td class="num">${fmt(r.tax)}</td>
      <td class="num">${fmt(r.total)}</td>
      <td class="num">${fmt(r.paid_amount)}</td>
      <td class="num">${fmt(r.open_balance)}</td>
    </tr>`).join('');
  rows.forEach((r:any)=>{
    sum.subtotal += Number(r.subtotal||0);
    sum.labor_total += Number(r.labor_total||0);
    sum.tax += Number(r.tax||0);
    sum.total += Number(r.total||0);
    sum.paid_amount += Number(r.paid_amount||0);
    sum.open_balance += Number(r.open_balance||0);
  });
  const tfoot = `
    <tr>
      <td colspan="5" style="font-weight:700;text-align:right">Totals</td>
      <td class="num" style="font-weight:700">${fmt(sum.subtotal)}</td>
      <td class="num" style="font-weight:700">${fmt(sum.labor_total)}</td>
      <td class="num" style="font-weight:700">${fmt(sum.tax)}</td>
      <td class="num" style="font-weight:700">${fmt(sum.total)}</td>
      <td class="num" style="font-weight:700">${fmt(sum.paid_amount)}</td>
      <td class="num" style="font-weight:700">${fmt(sum.open_balance)}</td>
    </tr>`;
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; color: #111827; margin: 24px; }
        .report-header{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 16px; }
        .company .name{ font-size: 14pt; font-weight:700; }
        .meta{ text-align:right; }
        .meta .title{ font-size: 16pt; font-weight:700; }
        .meta .subtitle{ color:#6b7280; font-size:10pt; }
        table{ width:100%; border-collapse:collapse; }
        th, td{ border:1px solid #e5e7eb; padding:6px 8px; }
        th{ background:#f3f4f6; text-align:left; }
        .num{ text-align:right; }
      </style>
    </head>
    <body>
      ${header}
      <table>
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}</tbody>
        <tfoot>${tfoot}</tfoot>
      </table>
    </body>
  </html>`;
}

function escapeHtml(str: string) {
  return String(str).replace(/[&<>"']/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]!));
}

function fmt(n: any){ const v = Number(n||0); return v.toFixed(2); }

// Generic PDF builder for simple tables
function buildReportHtml(meta: { title: string; subtitle?: string }, columns: { key: string; label: string; format?: (v:any)=>string }[], rows: any[], opts?: { summaryRow?: (rows:any[])=>Record<string, any>, summaryLabel?: string }): string {
  const companyName = escapeHtml(config.COMPANY_NAME);
  const companyLine = escapeHtml([
    config.COMPANY_ADDRESS,
    config.COMPANY_PHONE,
    config.COMPANY_WEBSITE
  ].filter(Boolean).join(' • '));
  const thead = columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('');
  const tbody = rows.map(r => {
    const tds = columns.map(c => {
      const val = (r as any)[c.key];
      const txt = c.format ? c.format(val) : (val ?? '');
      const isNum = typeof val === 'number';
      return `<td class="${isNum ? 'num' : ''}">${isNum ? fmt(val) : escapeHtml(String(txt))}</td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('');
  // Summary row
  const totals: Record<string, number> = {};
  rows.forEach(r => {
    columns.forEach(c => {
      const num = Number((r as any)[c.key]);
      if (!isNaN(num) && isFinite(num)) {
        totals[c.key] = (totals[c.key] || 0) + num;
      }
    });
  });
  if (opts?.summaryRow) {
    const custom = opts.summaryRow(rows);
    Object.assign(totals, custom);
  }
  const tfootTds = columns.map((c, idx) => {
    if (idx === 0) { const label = opts?.summaryLabel ? String(opts.summaryLabel) : 'Totals'; return `<td style="font-weight:700">${escapeHtml(label)}</td>`; }
    const val = totals[c.key];
    if (val === undefined || val === null || Number.isNaN(val)) return `<td></td>`;
    const formatted = c.format ? c.format(val) : fmt(val);
    return `<td class="num" style="font-weight:700">${formatted}</td>`;
  }).join('');
  const tfoot = `<tr>${tfootTds}</tr>`;
  return `<!doctype html>
  <html><head><meta charset="utf-8" />
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;font-size:11pt;color:#111827;margin:24px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px}
    .meta{text-align:right}.meta .title{font-size:16pt;font-weight:700}.meta .subtitle{color:#6b7280;font-size:10pt}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #e5e7eb;padding:6px 8px}th{background:#f3f4f6;text-align:left}
    .num{text-align:right}
  </style></head>
  <body>
    <div class="hdr">
      <div class="company"><div class="name">${companyName}</div><div class="sub">${companyLine}</div></div>
      <div class="meta"><div class="title">${escapeHtml(meta.title)}</div>${meta.subtitle?`<div class="subtitle">${escapeHtml(meta.subtitle)}</div>`:''}<div class="generated">Generated: ${new Date().toISOString().slice(0,16).replace('T',' ')}</div></div>
    </div>
    <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody><tfoot>${tfoot}</tfoot></table>
  </body></html>`;
}

// PDF endpoints for other reports
export const salesByMonthPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = parseDateRange(req);
    const p: any = { start, end };
    if (req.query.salesmanId) p.salesmanId = Number(req.query.salesmanId);
    if (req.query.customerId) p.customerId = Number(req.query.customerId);
    if (req.query.state) p.state = String(req.query.state);
    const rows = await getSalesByMonth(p);
    const columns = [
      { key: 'month', label: 'Month' },
      { key: 'invoices', label: 'Invoices' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'tax', label: 'Tax' },
      { key: 'total', label: 'Total' },
    ];
    const html = buildReportHtml({ title: 'Sales by Month', subtitle: invoiceSubtitleFromQuery(req.query) }, columns, rows);
    const browser = await browserPool.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'Letter', landscape: true, margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }, printBackground: true });
      await page.close();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_by_month.pdf"');
      return res.end(Buffer.from(pdf));
    } finally { browserPool.releaseBrowser(browser); }
  } catch (err) { next(err); }
};

export const salesBySalesmanPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = parseDateRange(req);
    const p: any = { start, end };
    if (req.query.state) p.state = String(req.query.state);
    const rows = await getSalesBySalesman(p);
    const columns = [
      { key: 'key_name', label: 'Salesman' },
      { key: 'invoices', label: 'Invoices' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'tax', label: 'Tax' },
      { key: 'total', label: 'Total' },
      { key: 'avg_invoice', label: 'Avg Invoice' },
      { key: 'last_invoice_date', label: 'Last Invoice' },
    ];
    const html = buildReportHtml({ title: 'Sales by Salesman', subtitle: invoiceSubtitleFromQuery(req.query) }, columns, rows);
    const browser = await browserPool.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'Letter', margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }, printBackground: true });
      await page.close();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_by_salesman.pdf"');
      return res.end(Buffer.from(pdf));
    } finally { browserPool.releaseBrowser(browser); }
  } catch (err) { next(err); }
};

export const salesByCustomerPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = parseDateRange(req);
    const p: any = { start, end };
    if (req.query.state) p.state = String(req.query.state);
    const rows = await getSalesByCustomer(p);
    const columns = [
      { key: 'key_name', label: 'Customer' },
      { key: 'invoices', label: 'Invoices' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'tax', label: 'Tax' },
      { key: 'total', label: 'Total' },
      { key: 'avg_invoice', label: 'Avg Invoice' },
      { key: 'last_invoice_date', label: 'Last Invoice' },
    ];
    const html = buildReportHtml({ title: 'Sales by Customer', subtitle: invoiceSubtitleFromQuery(req.query) }, columns, rows);
    const browser = await browserPool.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'Letter', margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }, printBackground: true });
      await page.close();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_by_customer.pdf"');
      return res.end(Buffer.from(pdf));
    } finally { browserPool.releaseBrowser(browser); }
  } catch (err) { next(err); }
};

export const taxByStatePdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = parseDateRange(req);
    const rows = await getTaxByState({ start, end });
    const columns = [
      { key: 'state', label: 'State' },
      { key: 'invoices', label: 'Invoices' },
      { key: 'taxable', label: 'Taxable' },
      { key: 'non_taxable_labor', label: 'Non‑tax Labor' },
      { key: 'tax', label: 'Tax' },
      { key: 'effective_rate', label: 'Effective Rate', format: (v:any)=> Number(v||0).toFixed(4) },
    ];
    const html = buildReportHtml(
      { title: 'Tax by State', subtitle: invoiceSubtitleFromQuery(req.query) },
      columns,
      rows,
      { summaryRow: (rows:any[]) => {
          const totals:any = { taxable:0, non_taxable_labor:0, tax:0 };
          rows.forEach((r:any)=>{ totals.taxable+=Number(r.taxable||0); totals.non_taxable_labor+=Number(r.non_taxable_labor||0); totals.tax+=Number(r.tax||0); });
          totals.effective_rate = totals.taxable > 0 ? totals.tax / totals.taxable : 0;
          return totals;
        }, summaryLabel: 'Totals' }
    );
    const browser = await browserPool.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'Letter', margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }, printBackground: true });
      await page.close();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="tax_by_state.pdf"');
      return res.end(Buffer.from(pdf));
    } finally { browserPool.releaseBrowser(browser); }
  } catch (err) { next(err); }
};

export const arUnpaidPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asOf = (req.query.asOf as string) || new Date().toISOString().slice(0, 10);
    const issuedStart = (req.query.issuedStart as string) || undefined;
    const issuedEnd = (req.query.issuedEnd as string) || undefined;
    const salesmanId = req.query.salesmanId ? Number(req.query.salesmanId) : undefined;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const state = (req.query.state as string) || undefined;
    const unpaidParams: any = { asOf };
    if (issuedStart) unpaidParams.issuedStart = issuedStart;
    if (issuedEnd) unpaidParams.issuedEnd = issuedEnd;
    if (salesmanId) unpaidParams.salesmanId = salesmanId;
    if (customerId) unpaidParams.customerId = customerId;
    if (state) unpaidParams.state = state;
    const rows = await getUnpaid(unpaidParams);
    const columns = [
      { key: 'invoice_number', label: 'Invoice #' },
      { key: 'order_number', label: 'Order #' },
      { key: 'po_number', label: 'PO #' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'invoice_date', label: 'Invoice Date' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'amount', label: 'Amount' },
      { key: 'paid', label: 'Paid' },
      { key: 'balance', label: 'Balance' },
    ];
    const html = buildReportHtml({ title: 'Unpaid Invoices', subtitle: `As of ${asOf}` }, columns, rows);
    const browser = await browserPool.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'Letter', margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }, printBackground: true });
      await page.close();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="ar_unpaid.pdf"');
      return res.end(Buffer.from(pdf));
    } finally { browserPool.releaseBrowser(browser); }
  } catch (err) { next(err); }
};

export const arAgingPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asOf = (req.query.asOf as string) || new Date().toISOString().slice(0, 10);
    const issuedStart = (req.query.issuedStart as string) || undefined;
    const issuedEnd = (req.query.issuedEnd as string) || undefined;
    const salesmanId = req.query.salesmanId ? Number(req.query.salesmanId) : undefined;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const state = (req.query.state as string) || undefined;
    const agingParams: any = { asOf };
    if (issuedStart) agingParams.issuedStart = issuedStart;
    if (issuedEnd) agingParams.issuedEnd = issuedEnd;
    if (salesmanId != null) agingParams.salesmanId = salesmanId;
    if (customerId != null) agingParams.customerId = customerId;
    if (state) agingParams.state = state;
    const rows = await getAging(agingParams);
    const columns = [
      { key: 'customer_name', label: 'Customer' },
      { key: 'current', label: 'Current' },
      { key: 'd1_30', label: '1–30' },
      { key: 'd31_60', label: '31–60' },
      { key: 'd61_90', label: '61–90' },
      { key: 'd90_plus', label: '>90' },
      { key: 'invoices', label: 'Invoices' },
      { key: 'total', label: 'Total' },
    ];
    const html = buildReportHtml({ title: 'AR Aging', subtitle: `As of ${asOf}` }, columns, rows);
    const browser = await browserPool.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'Letter', margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }, printBackground: true });
      await page.close();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="ar_aging.pdf"');
      return res.end(Buffer.from(pdf));
    } finally { browserPool.releaseBrowser(browser); }
  } catch (err) { next(err); }
};
