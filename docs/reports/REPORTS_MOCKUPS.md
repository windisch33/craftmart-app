# Reports Mockups (Updated)

Textual mockups showing identifiers and job item drill‑downs.

## Sales by Salesman (summary)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Reports                                         Date: May 1–31, 2025  [CSV] │
└──────────────────────────────────────────────────────────────────────────────┘
 Tab: Salesmen   Filters: [Salesman: All] [Customer: All] [State: All]

 Sales by Salesman
 ┌──────────────────────────────┬──────────┬───────────┬────────┬─────────┬─────────────┐
 │ Salesman                     │ Invoices │ Subtotal  │  Tax   │  Total  │ Avg Invoice │
 ├──────────────────────────────┼──────────┼───────────┼────────┼─────────┼─────────────┤
 │ Jane Smith                   │   16     │ 88,000.00 │ 6,160  │ 94,160  │ 5,885.00    │
 │ John Doe                     │   12     │ 54,200.00 │ 3,794  │ 57,994  │ 4,832.83    │
 └──────────────────────────────┴──────────┴───────────┴────────┴─────────┴─────────────┘

 Salesman Total — Jane Smith (May 2025)
 - Invoices: 16  •  Subtotal: 88,000.00  •  Tax: 6,160.00  •  Total: 94,160.00  •  Avg: 5,885.00

 Invoice List — Jane Smith (May 2025)
 ┌──────────────┬────────────┬──────────────────────┬──────────────────┬──────────┬───────┬─────────┬───────────────┐
 │ Invoice #    │ Order #    │ Job Title            │ Customer         │ Subtotal │ Tax   │ Total   │ Invoice Date  │
 ├──────────────┼────────────┼──────────────────────┼──────────────────┼──────────┼───────┼─────────┼───────────────┤
 │ INV‑2025‑310 │ #43        │ test pdf 1234        │ Christopher Clark│ 1,100.00 │ 66.00 │ 1,166.00│ 2025‑08‑20     │
 │ INV‑2025‑311 │ #25        │ ABC Flooring – Stairs│ ABC Flooring     │   950.00 │ 57.00 │ 1,007.00│ 2025‑08‑22     │
 └──────────────┴────────────┴──────────────────────┴──────────────────┴──────────┴───────┴─────────┴───────────────┘

Note: No Job Items drill‑down is shown in this mockup for Sales by Salesman.
```

## Sales by Customer (Invoice drill‑down)

```
 Invoice List — Christopher Clark (Aug 2025)
 ┌──────────────┬────────────┬──────────────────────┬──────────┬───────┬─────────┬───────────────┐
 │ Invoice #    │ Order #    │ Job Title            │ Subtotal │ Tax   │ Total   │ Invoice Date  │
 ├──────────────┼────────────┼──────────────────────┼──────────┼───────┼─────────┼───────────────┤
 │ INV‑2025‑310 │ #43        │ test pdf 1234        │ 1,100.00 │ 66.00 │ 1,166.00│ 2025‑08‑20     │
 └──────────────┴────────────┴──────────────────────┴──────────┴───────┴─────────┴───────────────┘
```

## Unpaid Invoices

```
 Unpaid Invoices — All Customers (as of Today)
 ┌──────────────┬────────────┬──────────────────┬─────────────┬────────────┬──────────┬────────┬──────────┬───────────────┬──────────────┐
 │ Invoice #    │ Order #    │ Customer         │ Salesman    │ Invoice Dt │ Due Date │ Amount │  Paid    │ Balance       │ Days Past Due│
 ├──────────────┼────────────┼──────────────────┼─────────────┼────────────┼──────────┼────────┼──────────┼───────────────┼──────────────┤
 │ INV‑2025‑310 │ #43        │ Christopher Clark │ Joe Smith   │ 2025‑08‑20 │ 2025‑09‑19│ 1,166  │ 0.00     │ 1,166.00      │ 11           │
 └──────────────┴────────────┴──────────────────┴─────────────┴────────────┴──────────┴────────┴──────────┴───────────────┴──────────────┘
```

## Tax by State (Invoice drill‑down)

```
 Invoice List — Maryland (Aug 2025)
 ┌──────────────┬────────────┬──────────────────────┬──────────────┬──────────┬─────────┬──────┬───────────────┐
 │ Invoice #    │ Order #    │ Customer             │ Taxable Sales│ Tax      │ Total   │State│ Invoice Date  │
 ├──────────────┼────────────┼──────────────────────┼──────────────┼──────────┼─────────┼──────┼───────────────┤
 │ INV‑2025‑310 │ #43        │ Christopher Clark    │ 1,100.00     │ 66.00    │ 1,166.00│ MD  │ 2025‑08‑20     │
 └──────────────┴────────────┴──────────────────────┴──────────────┴──────────┴─────────┴──────┴───────────────┘
```

Notes
- These mockups reflect the presence of both identifiers: `Invoice #` and `Order #` (job item id).
- The Job Items panel intentionally mirrors the job PDF sections to aid reconciliation.
