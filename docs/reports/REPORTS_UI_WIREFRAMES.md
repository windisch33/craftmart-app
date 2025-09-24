# Reports UI Wireframes (Textual)

This document sketches the desktop‑first, mobile‑compatible Reports UI without code. It focuses on structure, flows, and consistent interaction patterns.

## Global Layout
- Header: “Reports” (page title), global date range picker (presets + custom), Export dropdown (CSV/XLSX/PDF for current tab).
- Sticky Filters Bar (below header): salesman, customer, state, status, grouping, density (compact/comfortable). Collapsible on mobile.
- Content: Summary cards (optional), Tabs (top): Sales, Salesmen, Customers, Tax, AR/Aging, Unpaid, Payments (phase 2).
- Table area: sticky table header, sortable columns, pagination or virtual scroll, inline totals row where applicable.

## Desktop Wireframes

1) Top of page
- [Reports]                                      [ Date Range ▼ ] [ Export ▼ ]
- [ Search… ]  [ Salesman ▼ ] [ Customer ▼ ] [ State ▼ ] [ Grouping ▼ ] [ Density ▼ ] [ Refresh ]
- ─────────────────────────────────────────────────────────────────────────

2) Tabs row
- Sales | Salesmen | Customers | Tax | AR/Aging | Unpaid | Payments (phase 2)

3) Summary cards (optional, per tab)
- [ Total Sales ]  [ Total Tax ]  [ Unpaid ]  [ Over 30 Days ]  [ AR Total ]

4) Table (example: Sales by Month)
- Columns: Month | Invoices | Subtotal | Tax | Total
- Rows: 2025‑09 | 112 | $123,456.00 | $8,641.92 | $132,097.92
- Footer (optional): totals for current range

5) Table (Sales by Salesman)
- Columns: Salesman | Invoices | Subtotal | Tax | Total | Avg Invoice
- Rows: Jane Smith | 16 | $88,000.00 | $6,160.00 | $94,160.00 | $5,885.00
- Interaction: clicking a row opens a side panel with invoice list (drill‑down) and export button (respects filters)

6) Table (Sales by Customer)
- Columns: Customer | Invoices | Subtotal | Tax | Total | Last Invoice Date
- Rows: ACME Homes | 9 | …

7) Table (Tax by State)
- Columns: State | Invoices | Taxable | Tax | Effective Rate
- Rows: MD | 63 | $250,000.00 | $15,000.00 | 6.00%

8) Table (Unpaid Invoices)
- Columns: Invoice # | Customer | Salesman | Invoice Date | Due Date | Amount | Paid | Balance
- Interaction: bulk select + Export CSV

9) Table (AR Aging – customer level)
- Columns: Customer | Current | 1–30 | 31–60 | 61–90 | >90 | Total | Invoices
- Layout: allow Landscape for PDF; freeze Customer column on wide tables

## Mobile Wireframes
- Header collapses (Date Range becomes a sheet/dialog, Export in kebab menu).
- Filters collapse into a single “Filters (N)” button; opens sheet with fields.
- Tabs become a segmented control, scrollable horizontally.
- Tables render as responsive cards: each row → stacked key/value pairs with prominent value (e.g., Total) and links for drill‑down.

## Common Interactions
- Sorting: click column header, shows ▲/▼ indicator
- Drill‑down: row click opens side panel (desktop) or full‑screen sheet (mobile)
- Export: current tab + filters; CSV default
- Density: comfortable/compact toggles padding and font size
- Saved presets (later): save a named filter/date combo for quick access

## Visual Language
- Typography aligned with app PDFs (clear, no banners). Minimum 10pt.
- High contrast for accessibility; avoid color‑only cues.
- Currency right‑aligned; dates centered or right‑aligned consistently.

## Empty States & Errors
- Empty: friendly message with current filters and quick “Reset filters” button
- Errors: non‑blocking toast + inline retry for the table

---

These wireframes serve as the blueprint for implementing the Reports page. See CSV_SPECS.md for export field details and REPORTS_PLAN.md for endpoints and behavior.

