# CraftMart - Custom Staircase Management System

A web application for CraftMart Inc to manage customers, jobs, and shop operations for custom staircase manufacturing.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL
- **Deployment**: Docker & Docker Compose

## Quick Start

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your database credentials

3. Start the application:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Development

- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`

## Features

- Customer Management
- Job Management (Quotes → Orders → Invoices)
- Shop Management with Cut Sheets
- Sales and Tax Reports