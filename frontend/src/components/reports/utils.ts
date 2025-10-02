export function sumSalesRows(rows: Array<{ invoices?: number; subtotal?: number; tax?: number; total?: number; }>) {
  return rows.reduce<{ invoices: number; subtotal: number; tax: number; total: number }>((acc, r) => ({
    invoices: (acc.invoices) + Number(r.invoices || 0),
    subtotal: (acc.subtotal) + Number(r.subtotal || 0),
    tax: (acc.tax) + Number(r.tax || 0),
    total: (acc.total) + Number(r.total || 0),
  }), { invoices: 0, subtotal: 0, tax: 0, total: 0 });
}

export function sumTaxRows(rows: Array<{ taxable?: number; non_taxable_labor?: number; tax?: number; }>) {
  const totals = rows.reduce<{ taxable: number; non_taxable_labor: number; tax: number }>((acc, r) => ({
    taxable: (acc.taxable) + Number(r.taxable || 0),
    non_taxable_labor: (acc.non_taxable_labor) + Number(r.non_taxable_labor || 0),
    tax: (acc.tax) + Number(r.tax || 0),
  }), { taxable: 0, non_taxable_labor: 0, tax: 0 });
  const effective_rate = totals.taxable > 0 ? totals.tax / totals.taxable : 0;
  return { ...totals, effective_rate };
}

export function sumUnpaidRows(rows: Array<{ amount?: number; paid?: number; balance?: number; }>) {
  return rows.reduce<{ amount: number; paid: number; balance: number }>((acc, r) => ({
    amount: (acc.amount) + Number(r.amount || 0),
    paid: (acc.paid) + Number(r.paid || 0),
    balance: (acc.balance) + Number(r.balance || 0),
  }), { amount: 0, paid: 0, balance: 0 });
}

export function sumAgingRows(rows: Array<{ current?: number; d1_30?: number; d31_60?: number; d61_90?: number; d90_plus?: number; invoices?: number; total?: number; }>) {
  return rows.reduce<{ current: number; d1_30: number; d31_60: number; d61_90: number; d90_plus: number; invoices: number; total: number }>((acc, r) => ({
    current: (acc.current) + Number(r.current || 0),
    d1_30: (acc.d1_30) + Number(r.d1_30 || 0),
    d31_60: (acc.d31_60) + Number(r.d31_60 || 0),
    d61_90: (acc.d61_90) + Number(r.d61_90 || 0),
    d90_plus: (acc.d90_plus) + Number(r.d90_plus || 0),
    invoices: (acc.invoices) + Number(r.invoices || 0),
    total: (acc.total) + Number(r.total || 0),
  }), { current:0, d1_30:0, d31_60:0, d61_90:0, d90_plus:0, invoices:0, total:0 });
}

