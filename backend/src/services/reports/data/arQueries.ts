import pool from '../../../config/database';

export type UnpaidInvoiceRow = {
  invoice_id: number;
  invoice_number: string;
  order_id: number;
  order_number: string;
  po_number: string | null;
  job_title: string | null;
  customer_id: number | null;
  customer_name: string | null;
  salesman_id: number | null;
  salesman_name: string | null;
  invoice_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  amount: number; // total
  paid: number; // paid_amount
  balance: number; // open_balance
};

export async function getUnpaid(params: {
  asOf: string; // YYYY-MM-DD
  issuedStart?: string;
  issuedEnd?: string;
  salesmanId?: number;
  customerId?: number;
  state?: string;
}): Promise<UnpaidInvoiceRow[]> {
  const where: string[] = ['invoice_date <= $1'];
  const values: any[] = [params.asOf];
  if (params.issuedStart) { values.push(params.issuedStart); where.push(`invoice_date >= $${values.length}`); }
  if (params.issuedEnd) { values.push(params.issuedEnd); where.push(`invoice_date <= $${values.length}`); }
  if (params.salesmanId) { values.push(params.salesmanId); where.push(`salesman_id = $${values.length}`); }
  if (params.customerId) { values.push(params.customerId); where.push(`customer_id = $${values.length}`); }
  if (params.state) { values.push(params.state); where.push(`state = $${values.length}`); }

  const sql = `SELECT invoice_id, invoice_number, order_id, order_number, po_number,
                      job_title, customer_id, customer_name, salesman_id, salesman_name,
                      invoice_date::text, due_date::text,
                      total_amount AS amount,
                      COALESCE(paid_amount, 0) AS paid,
                      (total_amount - COALESCE(paid_amount,0)) AS balance
               FROM invoices_view
               WHERE ${where.join(' AND ')}
                 AND (total_amount - COALESCE(paid_amount,0)) > 0
               ORDER BY due_date DESC NULLS LAST, invoice_id DESC`;
  const { rows } = await pool.query(sql, values);
  return rows.map((r) => ({
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
    amount: Number(r.amount || 0),
    paid: Number(r.paid || 0),
    balance: Number(r.balance || 0),
  }));
}

export type AgingRow = {
  customer_id: number | null;
  customer_name: string | null;
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90_plus: number;
  invoices: number;
  total: number;
};

export async function getAging(params: {
  asOf: string;
  issuedStart?: string;
  issuedEnd?: string;
  salesmanId?: number;
  customerId?: number;
  state?: string;
  bucketSize?: number; // keep for compatibility though we use 30-day buckets
}): Promise<AgingRow[]> {
  const { asOf, issuedStart, issuedEnd } = params;
  const where: string[] = [ 'invoice_date <= $1' ];
  const values: any[] = [asOf];
  if (issuedStart) { values.push(issuedStart); where.push(`invoice_date >= $${values.length}`); }
  if (issuedEnd) { values.push(issuedEnd); where.push(`invoice_date <= $${values.length}`); }
  if (params.salesmanId) { values.push(params.salesmanId); where.push(`salesman_id = $${values.length}`); }
  if (params.customerId) { values.push(params.customerId); where.push(`customer_id = $${values.length}`); }
  if (params.state) { values.push(params.state); where.push(`state = $${values.length}`); }

  const sql = `WITH open AS (
    SELECT customer_id, customer_name,
           invoice_id, invoice_date, due_date,
           (total_amount - COALESCE(paid_amount,0)) AS balance,
           GREATEST(0, DATE_PART('day', $1::date - COALESCE(due_date, invoice_date))) AS days
    FROM invoices_view
    WHERE (total_amount - COALESCE(paid_amount,0)) > 0
      AND ${where.join(' AND ')}
  )
  SELECT customer_id, customer_name,
         SUM(CASE WHEN days <= 0 THEN balance ELSE 0 END) AS current,
         SUM(CASE WHEN days BETWEEN 1 AND 30 THEN balance ELSE 0 END) AS d1_30,
         SUM(CASE WHEN days BETWEEN 31 AND 60 THEN balance ELSE 0 END) AS d31_60,
         SUM(CASE WHEN days BETWEEN 61 AND 90 THEN balance ELSE 0 END) AS d61_90,
         SUM(CASE WHEN days > 90 THEN balance ELSE 0 END) AS d90_plus,
         COUNT(*) AS invoices,
         SUM(balance) AS total
  FROM open
  GROUP BY customer_id, customer_name
  ORDER BY total DESC NULLS LAST`;
  const { rows } = await pool.query(sql, values);
  return rows.map((r) => ({
    customer_id: r.customer_id != null ? Number(r.customer_id) : null,
    customer_name: r.customer_name ?? null,
    current: Number(r.current || 0),
    d1_30: Number(r.d1_30 || 0),
    d31_60: Number(r.d31_60 || 0),
    d61_90: Number(r.d61_90 || 0),
    d90_plus: Number(r.d90_plus || 0),
    invoices: Number(r.invoices || 0),
    total: Number(r.total || 0),
  }));
}
