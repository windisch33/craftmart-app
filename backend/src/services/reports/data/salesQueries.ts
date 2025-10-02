import pool from '../../../config/database';

export type SalesByMonthRow = {
  month: string; // YYYY-MM
  invoices: number;
  subtotal: number;
  tax: number;
  total: number;
};

export async function getSalesByMonth(params: {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  salesmanId?: number;
  customerId?: number;
  state?: string;
}): Promise<SalesByMonthRow[]> {
  const where: string[] = ['invoice_date BETWEEN $1 AND $2'];
  const values: any[] = [params.start, params.end];

  if (params.salesmanId) {
    values.push(params.salesmanId);
    where.push(`(salesman_id = $${values.length})`);
  }
  if (params.customerId) {
    values.push(params.customerId);
    where.push(`(customer_id = $${values.length})`);
  }
  if (params.state) {
    values.push(params.state);
    where.push(`(state = $${values.length})`);
  }

  const sql = `WITH months AS (
                 SELECT to_char(d, 'YYYY-MM') AS month
                 FROM generate_series(date_trunc('month', $1::date), date_trunc('month', $2::date), interval '1 month') AS gs(d)
               ),
               agg AS (
                 SELECT to_char(date_trunc('month', invoice_date), 'YYYY-MM') AS month,
                        COUNT(*) AS invoices,
                        SUM(subtotal) AS subtotal,
                        SUM(tax_amount) AS tax,
                        SUM(total_amount) AS total
                 FROM invoices_view
                 WHERE ${where.join(' AND ')}
                 GROUP BY 1
               )
               SELECT m.month,
                      COALESCE(a.invoices,0) AS invoices,
                      COALESCE(a.subtotal,0) AS subtotal,
                      COALESCE(a.tax,0) AS tax,
                      COALESCE(a.total,0) AS total
               FROM months m
               LEFT JOIN agg a ON a.month = m.month
               ORDER BY m.month`;
  const result = await pool.query(sql, values);
  return result.rows.map((r) => ({
    month: r.month,
    invoices: Number(r.invoices),
    subtotal: Number(r.subtotal || 0),
    tax: Number(r.tax || 0),
    total: Number(r.total || 0),
  }));
}

export type SalesGroupRow = {
  key_id: number | null;
  key_name: string | null;
  invoices: number;
  subtotal: number;
  tax: number;
  total: number;
  avg_invoice: number;
  last_invoice_date?: string | null;
};

async function getGroupedSales(groupBy: 'salesman' | 'customer', params: {
  start: string; end: string; state?: string; salesmanId?: number; customerId?: number;
}): Promise<SalesGroupRow[]> {
  const where: string[] = ['invoice_date BETWEEN $1 AND $2'];
  const values: any[] = [params.start, params.end];
  if (params.state) { values.push(params.state); where.push(`state = $${values.length}`); }
  if (params.salesmanId) { values.push(params.salesmanId); where.push(`salesman_id = $${values.length}`); }
  if (params.customerId) { values.push(params.customerId); where.push(`customer_id = $${values.length}`); }
  const keyId = groupBy === 'salesman' ? 'salesman_id' : 'customer_id';
  const keyName = groupBy === 'salesman' ? 'salesman_name' : 'customer_name';
  const sql = `SELECT ${keyId} AS key_id, ${keyName} AS key_name,
                      COUNT(*) AS invoices,
                      SUM(subtotal) AS subtotal,
                      SUM(tax_amount) AS tax,
                      SUM(total_amount) AS total,
                      CASE WHEN COUNT(*) > 0 THEN SUM(total_amount)::numeric/COUNT(*) ELSE 0 END AS avg_invoice,
                      MAX(invoice_date)::text AS last_invoice_date
               FROM invoices_view
               WHERE ${where.join(' AND ')}
               GROUP BY 1,2
               ORDER BY total DESC NULLS LAST`;
  const { rows } = await pool.query(sql, values);
  return rows.map((r) => ({
    key_id: r.key_id !== null ? Number(r.key_id) : null,
    key_name: r.key_name,
    invoices: Number(r.invoices),
    subtotal: Number(r.subtotal || 0),
    tax: Number(r.tax || 0),
    total: Number(r.total || 0),
    avg_invoice: Number(r.avg_invoice || 0),
    last_invoice_date: r.last_invoice_date ?? null,
  }));
}

export function getSalesBySalesman(params: { start: string; end: string; state?: string; }) {
  return getGroupedSales('salesman', params);
}

export function getSalesByCustomer(params: { start: string; end: string; state?: string; }) {
  return getGroupedSales('customer', params);
}
