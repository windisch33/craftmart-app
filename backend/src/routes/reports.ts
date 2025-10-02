import { Router } from 'express';
import * as legacyReportController from '../controllers/reportController';
import * as reportsController from '../controllers/reportsController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Legacy simple endpoints
router.get('/sales', legacyReportController.getSalesReport);
router.get('/tax', legacyReportController.getTaxReport);

// New reports API
router.get('/sales/by-month', reportsController.salesByMonth);
router.get('/sales/by-month/pdf', reportsController.salesByMonthPdf);
router.get('/sales/by-salesman', reportsController.salesBySalesman);
router.get('/sales/by-salesman/pdf', reportsController.salesBySalesmanPdf);
router.get('/sales/by-customer', reportsController.salesByCustomer);
router.get('/sales/by-customer/pdf', reportsController.salesByCustomerPdf);
router.get('/tax/by-state', requireAdmin, reportsController.taxByState);
router.get('/tax/by-state/pdf', requireAdmin, reportsController.taxByStatePdf);
router.get('/ar/unpaid', requireAdmin, reportsController.arUnpaid);
router.get('/ar/unpaid/pdf', requireAdmin, reportsController.arUnpaidPdf);
router.get('/ar/aging', requireAdmin, reportsController.arAging);
router.get('/ar/aging/pdf', requireAdmin, reportsController.arAgingPdf);
router.get('/invoices', reportsController.listInvoices);
router.get('/invoices/pdf', reportsController.listInvoicesPdf);
router.get('/invoices/:invoiceId/items', reportsController.getInvoiceItems);

export default router;
