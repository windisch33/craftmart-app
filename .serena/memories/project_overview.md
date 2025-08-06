# CraftMart Project Overview

## Project Purpose
CraftMart is a custom staircase manufacturer management system built for 6-10 employees. This web application helps manage:
- Customers (contact information, job history)
- Jobs (quotes → orders → invoices workflow)
- Shops with cut sheets
- Salesmen (commission tracking, performance metrics)
- Products (handrails, landing treads, rail parts)
- Sales and tax reports

## Production Environment
- **Live Site**: https://www.cmioe.com
- **Infrastructure**: Cloudflare Tunnel with Nginx reverse proxy
- **Security**: Zero-trust network access, JWT authentication

## Development Environment
- **System**: Linux (WSL/Ubuntu VM)
- **Container Platform**: Docker Compose
- **Database**: PostgreSQL 15
- **Main Ports**: 
  - Frontend: 3000
  - Backend API: 3001
  - Database: 5432

## Key Features
- JWT Authentication with role-based access
- Advanced job search and filtering system
- PDF generation for jobs
- Mobile-first responsive design
- Real-time tax calculations
- Section-based job organization
- Multi-product catalog with dynamic pricing