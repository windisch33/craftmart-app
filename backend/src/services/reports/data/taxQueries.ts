import pool from '../../../config/database';

export type TaxByStateRow = {
  state: string | null;
  invoices: number;
  taxable: number;
  tax: number;
  effective_rate: number;
  non_taxable_labor?: number | null;
  tax_exempt_amount?: number | null;
};

export async function getTaxByState(params: { start: string; end: string; }): Promise<TaxByStateRow[]> {
  // We alias subtotal as taxable_amount in invoices_view (migration 24). If not present, fallback safely.
  const sql = `SELECT state,
                      COUNT(*) AS invoices,
                      SUM(taxable_amount) AS taxable,
                      SUM(tax_amount) AS tax,
                      CASE WHEN SUM(taxable_amount) > 0 THEN SUM(tax_amount)/SUM(taxable_amount) ELSE 0 END AS effective_rate,
                      SUM(labor_total) AS non_taxable_labor
               FROM invoices_view
               WHERE invoice_date BETWEEN $1 AND $2
               GROUP BY state
               ORDER BY state`;
  const { rows } = await pool.query(sql, [params.start, params.end]);
  return rows.map((r) => ({
    state: r.state,
    invoices: Number(r.invoices || 0),
    taxable: Number(r.taxable || 0),
    tax: Number(r.tax || 0),
    effective_rate: Number(r.effective_rate || 0),
    non_taxable_labor: r.non_taxable_labor != null ? Number(r.non_taxable_labor) : null,
  }));
}

