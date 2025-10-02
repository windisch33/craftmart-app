import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export type SalesByMonthRow = {
  month: string;
  invoices: number;
  subtotal: number;
  tax: number;
  total: number;
};

export async function getSalesByMonth(params: { start?: string; end?: string; month?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  const { data } = await axios.get(`${API_BASE_URL}/api/reports/sales/by-month`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return data as SalesByMonthRow[];
}

export async function downloadSalesByMonthCsv(params: { start?: string; end?: string; month?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/api/reports/sales/by-month`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { ...params, export: 'csv' },
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  // Infer filename using month or start/end
  const name = params.month
    ? `sales_by_month_${params.month}.csv`
    : `sales_by_month_${params.start || ''}_to_${params.end || ''}.csv`;
  link.setAttribute('download', name);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadSalesByMonthPdf(params: { start?: string; end?: string; month?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/api/reports/sales/by-month/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  const label = (params as any).month ? (params as any).month : `${params.start || ''}_to_${params.end || ''}`;
  a.href = url; a.download = `sales_by_month_${label}.pdf`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
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

export async function getSalesBySalesman(params: { start?: string; end?: string; month?: string; state?: string; customerId?: number; }) {
  const token = localStorage.getItem('authToken');
  // Expand month if provided
  const range: any = { ...params };
  if (params.month && (!params.start || !params.end)) {
    range.month = params.month;
  }
  const { data } = await axios.get(`${API_BASE_URL}/api/reports/sales/by-salesman`, {
    headers: { Authorization: `Bearer ${token}` },
    params: range,
  });
  return data as SalesGroupRow[];
}

export async function getSalesByCustomer(params: { start?: string; end?: string; month?: string; state?: string; salesmanId?: number; }) {
  const token = localStorage.getItem('authToken');
  const range: any = { ...params };
  if (params.month && (!params.start || !params.end)) range.month = params.month;
  const { data } = await axios.get(`${API_BASE_URL}/api/reports/sales/by-customer`, {
    headers: { Authorization: `Bearer ${token}` },
    params: range,
  });
  return data as SalesGroupRow[];
}

export async function downloadSalesBySalesmanCsv(params: { start?: string; end?: string; month?: string; state?: string; customerId?: number; }) {
  const token = localStorage.getItem('authToken');
  const range: any = { ...params, export: 'csv' };
  const response = await axios.get(`${API_BASE_URL}/api/reports/sales/by-salesman`, {
    headers: { Authorization: `Bearer ${token}` },
    params: range,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  const label = params.month ? params.month : `${params.start || ''}_to_${params.end || ''}`;
  a.href = url; a.download = `sales_by_salesman_${label}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export async function downloadSalesBySalesmanPdf(params: { start?: string; end?: string; month?: string; state?: string; customerId?: number; }) {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/api/reports/sales/by-salesman/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  const label = (params as any).month ? (params as any).month : `${params.start || ''}_to_${params.end || ''}`;
  a.href = url; a.download = `sales_by_salesman_${label}.pdf`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export async function downloadSalesByCustomerCsv(params: { start?: string; end?: string; month?: string; state?: string; salesmanId?: number; }) {
  const token = localStorage.getItem('authToken');
  const range: any = { ...params, export: 'csv' };
  const response = await axios.get(`${API_BASE_URL}/api/reports/sales/by-customer`, {
    headers: { Authorization: `Bearer ${token}` },
    params: range,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  const label = params.month ? params.month : `${params.start || ''}_to_${params.end || ''}`;
  a.href = url; a.download = `sales_by_customer_${label}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export async function downloadSalesByCustomerPdf(params: { start?: string; end?: string; month?: string; state?: string; salesmanId?: number; }) {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/api/reports/sales/by-customer/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  const label = (params as any).month ? (params as any).month : `${params.start || ''}_to_${params.end || ''}`;
  a.href = url; a.download = `sales_by_customer_${label}.pdf`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export type TaxByStateRow = {
  state: string | null;
  invoices: number;
  taxable: number;
  tax: number;
  effective_rate: number;
  non_taxable_labor?: number | null;
};

export async function getTaxByState(params: { start?: string; end?: string; month?: string; }) {
  const token = localStorage.getItem('authToken');
  const range: any = { ...params };
  if (params.month && (!params.start || !params.end)) range.month = params.month;
  const { data } = await axios.get(`${API_BASE_URL}/api/reports/tax/by-state`, {
    headers: { Authorization: `Bearer ${token}` },
    params: range,
  });
  return data as TaxByStateRow[];
}

export async function downloadTaxByStateCsv(params: { start?: string; end?: string; month?: string; }) {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/api/reports/tax/by-state`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { ...params, export: 'csv' },
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  const label = params.month ? params.month : `${params.start || ''}_to_${params.end || ''}`;
  a.href = url; a.download = `tax_by_state_${label}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export async function downloadTaxByStatePdf(params: { start?: string; end?: string; month?: string; }) {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/api/reports/tax/by-state/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  const label = (params as any).month ? (params as any).month : `${params.start || ''}_to_${params.end || ''}`;
  a.href = url; a.download = `tax_by_state_${label}.pdf`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

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
  invoice_date: string;
  due_date: string;
  amount: number;
  paid: number;
  balance: number;
};

export async function getUnpaid(params: { asOf?: string; issuedStart?: string; issuedEnd?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  const { data } = await axios.get(`${API_BASE_URL}/api/reports/ar/unpaid`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { asOf: params.asOf || new Date().toISOString().slice(0,10), ...params },
  });
  return data as UnpaidInvoiceRow[];
}

export async function downloadUnpaidCsv(params: { asOf?: string; issuedStart?: string; issuedEnd?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/api/reports/ar/unpaid`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { ...params, export: 'csv', asOf: params.asOf || new Date().toISOString().slice(0,10) },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  const label = params.asOf || new Date().toISOString().slice(0,10);
  a.href = url; a.download = `ar_unpaid_${label}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export async function downloadUnpaidPdf(params: { asOf?: string; issuedStart?: string; issuedEnd?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/api/reports/ar/unpaid/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { asOf: params.asOf || new Date().toISOString().slice(0,10), ...params },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  const label = params.asOf || new Date().toISOString().slice(0,10);
  a.href = url; a.download = `ar_unpaid_${label}.pdf`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
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

export async function getAging(params: { asOf?: string; issuedStart?: string; issuedEnd?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  const { data } = await axios.get(`${API_BASE_URL}/api/reports/ar/aging`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { asOf: params.asOf || new Date().toISOString().slice(0,10), ...params },
  });
  return data as AgingRow[];
}

export async function downloadAgingCsv(params: { asOf?: string; issuedStart?: string; issuedEnd?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/api/reports/ar/aging`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { ...params, export: 'csv', asOf: params.asOf || new Date().toISOString().slice(0,10) },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  const label = params.asOf || new Date().toISOString().slice(0,10);
  a.href = url; a.download = `ar_aging_${label}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export async function downloadAgingPdf(params: { asOf?: string; issuedStart?: string; issuedEnd?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/api/reports/ar/aging/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { asOf: params.asOf || new Date().toISOString().slice(0,10), ...params },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  const label = params.asOf || new Date().toISOString().slice(0,10);
  a.href = url; a.download = `ar_aging_${label}.pdf`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// Invoice drill-down
export type InvoiceRow = {
  invoice_id: number;
  invoice_number: string;
  order_id: number;
  order_number: string;
  po_number?: string | null;
  job_title?: string | null;
  customer_id?: number | null;
  customer_name?: string | null;
  salesman_id?: number | null;
  salesman_name?: string | null;
  invoice_date: string;
  due_date: string;
  paid_date?: string | null;
  subtotal: number;
  labor_total: number;
  tax: number;
  total: number;
  paid_amount: number;
  open_balance: number;
};

export async function getInvoices(params: { start?: string; end?: string; month?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  const { data } = await axios.get(`${API_BASE_URL}/api/reports/invoices`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return data as InvoiceRow[];
}

export async function downloadInvoicesCsv(params: { start?: string; end?: string; month?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/api/reports/invoices`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { ...params, export: 'csv' },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  const label = (params as any).month ? (params as any).month : `${params.start || ''}_to_${params.end || ''}`;
  a.href = url; a.download = `invoices_${label}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export async function downloadInvoicesPdf(params: { start?: string; end?: string; month?: string; salesmanId?: number; customerId?: number; state?: string; }) {
  const token = localStorage.getItem('authToken');
  // Prefer dedicated PDF endpoint to avoid proxies stripping query params
  const response = await axios.get(`${API_BASE_URL}/api/reports/invoices/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { ...params },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  const label = (params as any).month ? (params as any).month : `${params.start || ''}_to_${params.end || ''}`;
  a.href = url; a.download = `invoices_${label}.pdf`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export type InvoiceItemRow = {
  section: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

// item-level download functions removed per updated requirements
