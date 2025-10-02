import React, { useState } from 'react';
import '../styles/common.css';
import './Reports.css';
import ReportFilters from '../components/reports/ReportFilters';
import { getSalesByMonth, downloadSalesByMonthCsv, downloadSalesByMonthPdf, getSalesBySalesman, getSalesByCustomer, downloadSalesBySalesmanCsv, downloadSalesBySalesmanPdf, downloadSalesByCustomerCsv, downloadSalesByCustomerPdf, getTaxByState, downloadTaxByStateCsv, downloadTaxByStatePdf, getUnpaid, getAging, downloadUnpaidCsv, downloadUnpaidPdf, downloadAgingCsv, downloadAgingPdf, getInvoices } from '../services/reportsService';
import type { SalesByMonthRow, SalesGroupRow, InvoiceRow } from '../services/reportsService';
// Filters moved into ReportFilters component
import InvoiceModal from '../components/reports/InvoiceModal';
import SalesByMonthSection from '../components/reports/sections/SalesByMonthSection';
import SalesBySalesmanSection from '../components/reports/sections/SalesBySalesmanSection';
import SalesByCustomerSection from '../components/reports/sections/SalesByCustomerSection';
import TaxByStateSection from '../components/reports/sections/TaxByStateSection';
import UnpaidSection from '../components/reports/sections/UnpaidSection';
import ARAgingSection from '../components/reports/sections/ARAgingSection';

import salesmanService from '../services/salesmanService';
import customerService from '../services/customerService';
import type { Salesman } from '../services/salesmanService';
import type { Customer } from '../services/customerService';

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [salesRows, setSalesRows] = useState<SalesByMonthRow[] | null>(null);
  const [taxRows, setTaxRows] = useState<any[] | null>(null);
  const [unpaidRows, setUnpaidRows] = useState<any[] | null>(null);
  const [agingRows, setAgingRows] = useState<any[] | null>(null);
  const [salesmanRows, setSalesmanRows] = useState<SalesGroupRow[] | null>(null);
  const [customerRows, setCustomerRows] = useState<SalesGroupRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<string>('');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[] | null>(null);
  const [invoiceContext, setInvoiceContext] = useState<any | null>(null);
  // Removed item details per requirement
  const [presets, setPresets] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('reportPresets') || '[]'); } catch { return []; }
  });
  const [presetName, setPresetName] = useState('');
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');

  React.useEffect(() => {
    (async () => {
      try {
        const [ss, cc] = await Promise.all([
          salesmanService.getAllSalesmen(true),
          customerService.getAllCustomers(),
        ]);
        setSalesmen(ss);
        setCustomers(cc);
      } catch (e) {
        // ignore
      }
    })();
  }, []);


  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #f3f4f6',
    transition: 'all 0.3s ease'
  };

  // (removed unused inputStyle)

  // Helpers moved to components/reports/utils

  // (removed placeholder recentReports)

  return (
    <div className="container">
      <ReportFilters
        reportType={reportType} setReportType={setReportType}
        dateRange={dateRange} setDateRange={setDateRange}
        month={month} setMonth={setMonth}
        salesmen={salesmen} customers={customers}
        selectedSalesmanId={selectedSalesmanId} setSelectedSalesmanId={setSelectedSalesmanId}
        selectedCustomerId={selectedCustomerId} setSelectedCustomerId={setSelectedCustomerId}
        selectedState={selectedState} setSelectedState={setSelectedState}
        presets={presets} setPresets={setPresets}
        presetName={presetName} setPresetName={setPresetName}
        loading={loading}
        onGenerate={async () => {
          try {
            setError(null); setLoading(true);
            setSalesRows(null); setTaxRows(null); setUnpaidRows(null); setAgingRows(null); setSalesmanRows(null); setCustomerRows(null);
            if (reportType === 'sales') {
              const params: any = {};
              if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
              if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
              if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
              if (selectedState) params.state = selectedState;
              const data = await getSalesByMonth(params);
              setSalesRows(data);
            } else if (reportType === 'salesman') {
              const params: any = {};
              if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
              if (selectedState) params.state = selectedState;
              if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
              const data = await getSalesBySalesman(params);
              setSalesmanRows(data);
            } else if (reportType === 'customer') {
              const params: any = {};
              if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
              if (selectedState) params.state = selectedState;
              if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
              const data = await getSalesByCustomer(params);
              setCustomerRows(data);
            } else if (reportType === 'tax') {
              const params: any = {};
              if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
              const data = await getTaxByState(params);
              setTaxRows(data);
            } else if (reportType === 'unpaid') {
              const params: any = { asOf: new Date().toISOString().slice(0,10) };
              if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
              if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
              if (selectedState) params.state = selectedState;
              const data = await getUnpaid(params);
              setUnpaidRows(data);
            } else if (reportType === 'aging') {
              const params: any = { asOf: new Date().toISOString().slice(0,10) };
              if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
              if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
              if (selectedState) params.state = selectedState;
              const data = await getAging(params);
              setAgingRows(data);
            }
          } catch (e: any) {
            setError(e?.response?.data?.error || e?.message || 'Failed to load report');
          } finally {
            setLoading(false);
          }
        }}
      />

      {/* Sales by Month Results */}
      {salesRows && reportType === 'sales' && (
        <SalesByMonthSection
          rows={salesRows}
          onDownloadCsv={async ()=>{
            const params: any = {};
            if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; }
            else { params.month = month || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`; }
            if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
            if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
            if (selectedState) params.state = selectedState;
            await downloadSalesByMonthCsv(params);
          }}
          onDownloadPdf={async ()=>{
            const params: any = {};
            if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; }
            else { params.month = month || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`; }
            if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
            if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
            if (selectedState) params.state = selectedState;
            await downloadSalesByMonthPdf(params);
          }}
          onOpenInvoicesForMonth={async (m)=>{
            const ctx:any = {};
            if (selectedSalesmanId) ctx.salesmanId = Number(selectedSalesmanId);
            if (selectedCustomerId) ctx.customerId = Number(selectedCustomerId);
            if (selectedState) ctx.state = selectedState;
            const rows = await getInvoices({ month: m, ...ctx });
            setInvoiceContext({ title:`Invoices — ${m}`, params:{ month: m, ...ctx } });
            setInvoiceRows(rows); setInvoiceModalOpen(true);
          }}
        />
      )}

      {/* Sales by Salesman */}
      {salesmanRows && reportType === 'salesman' && (
        <SalesBySalesmanSection
          rows={salesmanRows}
          onDownloadCsv={async ()=>{
            const params: any = {};
            if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
            if (selectedState) params.state = selectedState;
            if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
            await downloadSalesBySalesmanCsv(params);
          }}
          onDownloadPdf={async ()=>{
            const params: any = {};
            if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
            if (selectedState) params.state = selectedState;
            if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
            await downloadSalesBySalesmanPdf(params);
          }}
          onOpenInvoicesForSalesman={async (r)=>{
            const params:any = {};
            if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
            params.salesmanId = r.key_id ?? undefined;
            if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
            const rows = await getInvoices(params);
            setInvoiceContext({ title:`Invoices — ${r.key_name || r.key_id}`, params });
            setInvoiceRows(rows); setInvoiceModalOpen(true);
          }}
        />
      )}

      {/* Sales by Customer */}
      {customerRows && reportType === 'customer' && (
        <SalesByCustomerSection
          rows={customerRows}
          onDownloadCsv={async ()=>{
            const params: any = {};
            if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
            if (selectedState) params.state = selectedState;
            if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
            await downloadSalesByCustomerCsv(params);
          }}
          onDownloadPdf={async ()=>{
            const params: any = {};
            if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
            if (selectedState) params.state = selectedState;
            if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
            await downloadSalesByCustomerPdf(params);
          }}
          onOpenInvoicesForCustomer={async (r)=>{
            const params:any = {};
            if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
            params.customerId = r.key_id ?? undefined;
            if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
            const rows = await getInvoices(params);
            setInvoiceContext({ title:`Invoices — ${r.key_name || r.key_id}`, params });
            setInvoiceRows(rows); setInvoiceModalOpen(true);
          }}
        />
      )}
      
      {/* Tax by State Results */}
      {taxRows && reportType === 'tax' && (
        <TaxByStateSection
          rows={taxRows as any}
          onDownloadCsv={async ()=>{
            const params: any = {};
            if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
            await downloadTaxByStateCsv(params);
          }}
          onDownloadPdf={async ()=>{
            const params: any = {};
            if (dateRange.start && dateRange.end) { params.start = dateRange.start; params.end = dateRange.end; } else if (month) { params.month = month; }
            await downloadTaxByStatePdf(params);
          }}
        />
      )}

      {/* Unpaid */}
      {unpaidRows && reportType === 'unpaid' && (
        <UnpaidSection
          rows={unpaidRows as any}
          onDownloadCsv={async ()=>{
            const params: any = { asOf: new Date().toISOString().slice(0,10) };
            if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
            if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
            if (selectedState) params.state = selectedState;
            await downloadUnpaidCsv(params);
          }}
          onDownloadPdf={async ()=>{
            const params: any = { asOf: new Date().toISOString().slice(0,10) };
            if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
            if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
            if (selectedState) params.state = selectedState;
            await downloadUnpaidPdf(params);
          }}
        />
      )}

      {/* Aging */}
      {agingRows && reportType === 'aging' && (
        <ARAgingSection
          rows={agingRows as any}
          onDownloadCsv={async ()=>{
            const params: any = { asOf: new Date().toISOString().slice(0,10) };
            if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
            if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
            if (selectedState) params.state = selectedState;
            await downloadAgingCsv(params);
          }}
          onDownloadPdf={async ()=>{
            const params: any = { asOf: new Date().toISOString().slice(0,10) };
            if (selectedSalesmanId) params.salesmanId = Number(selectedSalesmanId);
            if (selectedCustomerId) params.customerId = Number(selectedCustomerId);
            if (selectedState) params.state = selectedState;
            await downloadAgingPdf(params);
          }}
        />
      )}

      {/* Invoices Drill-down Modal */}
      <InvoiceModal open={invoiceModalOpen} onClose={()=> setInvoiceModalOpen(false)} title={invoiceContext?.title || 'Invoices'} params={invoiceContext?.params || {}} rows={invoiceRows} />

      {error && (
        <div style={{...cardStyle, marginBottom:'32px', color:'#b91c1c', background:'#fef2f2', border:'1px solid #fecaca'}}>
          {error}
        </div>
      )}

      {/* Quick Reports and Recent Reports removed */}
    </div>
  );
};

export default Reports;
