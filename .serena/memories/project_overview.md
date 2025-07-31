# CraftMart Project Overview

CraftMart is a custom staircase manufacturer management system built for small-to-medium manufacturing businesses (6-10 employees). It's a comprehensive web application that helps manage customers, jobs (quotes → orders → invoices), shops with cut sheets, salesmen, and generate sales/tax reports.

## Live Production Site
- **URL**: https://www.cmioe.com
- **Infrastructure**: Cloudflare Tunnel with Nginx reverse proxy
- **Security**: Zero-trust network access, automatic HTTPS

## Core Features
1. **Customer Management** - Complete CRUD operations with search functionality
2. **Jobs System** - Advanced workflow from quotes to orders to invoices with:
   - Multi-step creation wizard
   - Section-based organization (Basement, Main Floor, etc.)
   - Product selection with materials and labor
   - Real-time tax calculations
   - Professional PDF generation
   - Advanced search and filtering
3. **Salesmen Management** - Commission tracking and performance metrics
4. **Products & Materials** - Handrail products with dynamic pricing
5. **Shop Management** - Cut sheet generation (planned feature)
6. **Reports** - Sales and tax reports (backend complete, frontend planned)

## Design Principles
- Modern, clean interface optimized for readability
- Mobile-first responsive design
- Touch-friendly with 44px+ touch targets
- Consistent design system with gradient headers
- Professional color palette suitable for manufacturing business