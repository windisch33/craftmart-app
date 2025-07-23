# CraftMart Project - Claude AI Assistant Guide

## Project Overview
CraftMart is a custom staircase manufacturer management system built for 6-10 employees. This web application helps manage customers, jobs (quotes → orders → invoices), shops with cut sheets, salesmen, and generate sales/tax reports.

## Design Requirements
**Modern, Clean & Readable Design:**
- **Visual Style:** Modern, clean interface that is easy to read and navigate
- **Logo Integration:** Company logo located at `/home/rwindisch/cmi-oe/craftmart-app/Logo.png` featured in the app design
- **User Experience:** Prioritize clarity, readability, and intuitive navigation for the 6-10 employee team
- **Color Scheme:** Professional, clean color palette suitable for a manufacturing business
- **Typography:** Clear, readable fonts with proper hierarchy and spacing

## Important: Always Reference Current Documentation
**⚠️ CRITICAL:** Before making any changes or recommendations, always consult the current official documentation for the technologies used in this project. Web technologies evolve rapidly, and best practices change frequently.

### Required Reading
1. **ALWAYS read `/home/rwindisch/cmi-oe/craftmart-app/outline.txt`** - Contains the original project requirements and specifications
2. Check current documentation for all major technologies before implementing features

## Tech Stack & Documentation Links

### Backend
- **Node.js 20** - [Current Node.js Docs](https://nodejs.org/docs/latest/)
- **Express.js** - [Express Documentation](https://expressjs.com/)
- **TypeScript** - [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **PostgreSQL** - [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- **Docker** - [Docker Documentation](https://docs.docker.com/)
- **bcryptjs** - Password hashing (replaced bcrypt for Alpine Linux compatibility)

### Frontend
- **React 19** - [React Documentation](https://react.dev/)
- **TypeScript** - [TypeScript with React](https://www.typescriptlang.org/docs/handbook/react.html)
- **External CSS Modules** - Component-scoped CSS files for maintainable styling
- **React Router** - [React Router Documentation](https://reactrouter.com/)
- **Vite** - [Vite Documentation](https://vitejs.dev/)
- **Axios** - HTTP client for API communication

### Infrastructure
- **Nginx** - [Nginx Documentation](https://nginx.org/en/docs/) - Reverse proxy for routing
- **Cloudflare Tunnel** - [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) - Secure internet access

## Project Structure
```
craftmart-app/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # API endpoint handlers
│   │   ├── routes/         # Express routes
│   │   ├── models/         # Database models (placeholder)
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── config/         # Database & environment config
│   │   └── utils/          # Helper functions
│   └── uploads/            # File storage for cut sheets
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── common/     # Shared components (Header, Sidebar)
│   │   │   ├── customers/  # Customer-specific components (CustomerForm)
│   │   │   ├── salesmen/   # Salesman-specific components (SalesmanForm)
│   │   │   └── jobs/       # Job-specific components
│   │   │       ├── JobForm.tsx          # Job creation wizard
│   │   │       ├── JobDetail.tsx        # Job detail modal viewer
│   │   │       ├── JobPDFPreview.tsx    # PDF preview and download
│   │   │       ├── AdvancedSearchBar.tsx # Multi-field search component
│   │   │       ├── FilterPanel.tsx      # Collapsible filter panel
│   │   │       ├── DateRangeFilter.tsx  # Date range filtering
│   │   │       ├── AmountRangeFilter.tsx # Amount range filtering
│   │   │       └── SortControls.tsx     # Professional sorting controls
│   │   ├── pages/          # Route-based page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API integration
│   │   ├── styles/         # Common CSS files and utilities
│   │   └── store/          # State management (Zustand)
├── database/               # PostgreSQL initialization
├── nginx/                  # Reverse proxy configuration
├── cloudflared/            # Cloudflare Tunnel configuration
├── docker-compose.yml     # Development environment
└── CLOUDFLARE_TUNNEL_SETUP.md # Tunnel deployment guide
```

## Development Commands

### Start Development Environment
```bash
docker-compose up -d
```

### Individual Service Development
```bash
# Backend only
cd backend && npm run dev

# Frontend only  
cd frontend && npm run dev

# Build for production
cd backend && npm run build
cd frontend && npm run build
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U craftmart_user -d craftmart

# Apply database migrations
docker-compose exec -T postgres psql -U craftmart_user -d craftmart < database/migrations/02-enhance-jobs-table.sql
```

## Database Schema

### Users Table
- Authentication and authorization
- Admin and employee roles
- JWT token-based authentication

### Customers Table
- Full contact information (name, address, city, state, zip, phone, mobile, fax, email, accounting_email)
- Notes field for miscellaneous info
- Created/updated timestamps

### Salesmen Table
- Personal information (first_name, last_name, email, phone)
- Commission rate tracking
- Active/inactive status
- Notes field

### Jobs Table
- Customer relationship
- Status tracking (quote/order/invoice)
- Separate amount fields for each stage
- Title and description

### Shops Table
- Job relationship
- Cut sheets stored as JSONB
- Notes for shop-specific information

### Products & Materials Tables
- Handrail products with pricing per 6" segments
- Materials with pricing multipliers
- Quote items for job integration

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get specific customer
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Salesmen
- `GET /api/salesmen` - List all salesmen (with active filter)
- `GET /api/salesmen/:id` - Get specific salesman
- `POST /api/salesmen` - Create new salesman
- `PUT /api/salesmen/:id` - Update salesman
- `DELETE /api/salesmen/:id` - Delete salesman (soft delete if has jobs)
- `GET /api/salesmen/search` - Search salesmen

### Jobs
- `GET /api/jobs` - List all jobs with advanced search and filtering support
  - **Advanced Search Parameters:**
    - `searchTerm` - Search term to find in job data
    - `searchField` - Field to search in: `title` (default), `all`, `customer`, `jobNumber`, `salesman`
    - `searchOperator` - Search operator: `contains` (default), `startsWith`, `exact`
  - **Filter Parameters:**
    - `statusFilter[]` - Array of status values to filter by: `quote`, `order`, `invoice`
    - `salesmanFilter[]` - Array of salesman IDs to filter by
    - `dateRangeType` - Date field to filter: `created` (default), `updated`, `delivery`
    - `dateRangeStart` - Start date for date range filter (YYYY-MM-DD)
    - `dateRangeEnd` - End date for date range filter (YYYY-MM-DD)
    - `amountRangeType` - Amount field to filter: `total` (default), `subtotal`, `labor`
    - `amountRangeMin` - Minimum amount for range filter
    - `amountRangeMax` - Maximum amount for range filter
  - **Sort Parameters:**
    - `sortBy` - Field to sort by: `created_date` (default), `total_amount`, `customer_name`, `title`, `updated_at`
    - `sortOrder` - Sort direction: `desc` (default), `asc`
  - **Legacy Parameters (for backward compatibility):**
    - `status` - Single status filter
    - `salesman_id` - Single salesman ID filter
- `GET /api/jobs/:id` - Get specific job with basic info
- `GET /api/jobs/:id/details` - Get job with sections and items
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job (auto-recalculates totals)
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/:id/pdf` - Generate and download job PDF

### Job Sections
- `GET /api/jobs/:jobId/sections` - List sections for a job
- `POST /api/jobs/:jobId/sections` - Create new section
- `PUT /api/jobs/sections/:sectionId` - Update section
- `DELETE /api/jobs/sections/:sectionId` - Delete section

### Quote Items
- `POST /api/jobs/:jobId/sections/:sectionId/items` - Add item to section
- `PUT /api/jobs/items/:itemId` - Update quote item
- `DELETE /api/jobs/items/:itemId` - Delete quote item

### Products & Materials
- `GET /api/products` - List all products
- `GET /api/products/handrails` - List handrail products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/materials` - List all materials
- `POST /api/materials` - Create material
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

### Reports
- `GET /api/reports/sales` - Sales report with optional date range
- `GET /api/reports/tax` - Tax report with optional date range

## Current Implementation Status

### ✅ Authentication System (COMPLETED)
- JWT Authentication with 24-hour token expiration
- bcryptjs for password hashing (Alpine Linux compatible)
- Protected routes with middleware
- Sample users: admin@craftmart.com, john.doe@craftmart.com, jane.smith@craftmart.com (password: password123)

### ✅ Production Deployment (COMPLETED)
- **Domain**: https://www.cmioe.com
- **Infrastructure**: Cloudflare Tunnel with Nginx reverse proxy
- **Security**: Zero-trust network access, no exposed ports
- **SSL/TLS**: Automatic HTTPS via Cloudflare

### ✅ Customer Management (COMPLETED)
- Full CRUD operations with form validation
- All customer fields displayed on cards
- Edit and Delete functionality only (no View button)
- Search by name, email, city, or state
- Notes displayed with "Notes:" label at bottom of cards

### ✅ Salesmen Management (COMPLETED)
- Full CRUD operations with commission tracking
- Active/inactive status management
- Edit and Delete functionality only (no View button)
- Search functionality
- Notes displayed with consistent formatting

### ✅ Handrail Products System (COMPLETED)
- Products and materials management
- Pricing calculation system
- Sample data with wood types and multipliers
- Ready for quote system integration

### ✅ Mobile Responsiveness (COMPLETED)
- Complete mobile-first responsive design
- Touch-friendly navigation with hamburger menu
- All pages optimized for mobile devices
- Minimum 44px touch targets

### ✅ Code Refactoring & Cleanup (COMPLETED)
- Removed 1200+ lines of dead code (5 unused Salesmen files, 3 unused CSS files)
- Extracted SalesmanForm component from inline form (120+ lines)
- Standardized API service error handling patterns
- Fixed CSS architecture with proper component-scoped styling
- Created reusable form components following CustomerForm pattern
- Unified button styling across all CRUD pages

### ✅ Jobs System Database Enhancement (COMPLETED - July 23, 2025)
- **Issue Fixed**: "Error Loading Jobs - Failed to fetch jobs" on Jobs page
- **Root Cause**: Database schema was missing enhanced fields required by the application
- **Solution Implemented**:
  - Created migration file: `database/migrations/02-enhance-jobs-table.sql`
  - Updated `database/init/01-init.sql` with complete enhanced schema
  - Added all missing fields: salesman_id, delivery_date, tax fields, pricing fields, etc.
  - Created supporting tables: salesmen, tax_rates, job_sections, quote_items
  - Fixed authentication token inconsistency (jobService using 'token' vs 'authToken')
- **Current Status**: Jobs page now loads successfully with enhanced data model

### ✅ PDF Preview & Generation System (COMPLETED - July 23, 2025)
- **Issue Fixed**: "Failed to download PDF" and problematic PDF generation
- **Root Cause Analysis**:
  - Puppeteer unable to launch Chrome in Alpine Linux Docker container
  - Currency formatting errors with string/number conversion
  - Sub-optimal print/download UX with extra browser windows
- **Solution Implemented**:
  - **Docker Enhancement**: Added Chromium and dependencies to Alpine Linux container
  - **PDF Service Fix**: Fixed formatCurrency function to handle database string values
  - **Preview Component**: Created `JobPDFPreview.tsx` with modal interface
  - **Download Optimization**: Uses cached blob URL instead of new API calls
  - **Print Enhancement**: 3-tier approach for direct print without extra windows
- **Features Delivered**:
  - Inline PDF preview in modal with iframe display
  - Direct download functionality using cached blob data
  - Direct print functionality (no extra browser windows)
  - Error handling and loading states
  - Mobile-responsive design
- **Current Status**: Full PDF generation, preview, download, and print functionality working

### ✅ Job Creation & Product Management System (COMPLETED - July 23, 2025)
- **Issues Fixed**: Multiple critical bugs preventing job creation with products
- **Root Cause Analysis**:
  - Infinite re-render loop when navigating to step 3 of job form
  - Double popup alerts when adding products
  - Blank screen when selecting products from dropdown
  - Products not being saved with jobs (showing $0.00 totals)
  - Database schema mismatch in quote_items table
- **Solution Implemented**:
  - **Infinite Loop Fix**: Replaced `validateForm(3)` in submit button with memoized `isFormValidForStep(3)` to prevent state updates during render
  - **Form Validation**: Separated validation logic into render-safe (`isFormValid()`) and action-safe (`validateForm()`) functions
  - **Product Selection**: Fixed string-to-number conversion issues with `Number()` wrapper for database values
  - **API URL Consistency**: Fixed jobService to use proper `${API_BASE_URL}/api/` pattern like other services
  - **Job Creation Flow**: Enhanced to create job → sections → items in proper sequence
  - **Database Schema**: Fixed quote_items table constraints by adding required `product_type` and `product_name` fields
- **Features Delivered**:
  - 3-step job creation wizard with validation
  - Section management with add/edit/delete functionality
  - Product selection with material and labor options
  - Real-time price calculations with tax
  - Proper job totals with taxable/non-taxable breakdown
  - Error boundaries for graceful error handling
- **Current Status**: Complete job creation system working with products, sections, and accurate pricing calculations

### ✅ Advanced Job Search & Filtering System (COMPLETED - July 23, 2025)
- **Feature Delivered**: Comprehensive search and filtering system for the Jobs page
- **Components Created**:
  - **AdvancedSearchBar**: Multi-field search with operators and quick presets
    - Search fields: Job Title (default), All Fields, Customer Name, Job Number, Salesman
    - Search operators: Contains (default), Starts With, Exact Match
    - Debounced search input (300ms) for performance
    - Quick search presets for common queries
  - **FilterPanel**: Collapsible filter panel with comprehensive options
    - Status filtering (Quote, Order, Invoice) with multi-select
    - Salesman filtering with multi-select from active salesmen
    - Date range filtering (Created, Updated, Delivery dates) with presets
    - Amount range filtering (Total, Subtotal, Labor) with currency formatting
    - Visual filter summary with active filter count and easy removal
  - **DateRangeFilter**: Professional date filtering component
    - Date type selection (Created, Updated, Delivery)
    - Custom date range inputs with validation
    - Quick presets: Today, Last 7 Days, Last 30 Days, Last 3 Months, Last Year
  - **AmountRangeFilter**: Currency-based amount filtering
    - Amount type selection (Total, Subtotal, Labor)
    - Min/max amount inputs with currency formatting
    - Quick presets: Under $1K, $1K-$5K, $5K-$10K, $10K-$25K, Over $25K
  - **SortControls**: Enhanced sorting interface
    - Sort fields: Created Date (default), Total Amount, Customer Name, Job Title, Updated Date
    - Clear ascending/descending toggle with visual indicators
    - Sort summary display with icons
- **Backend Enhancements**:
  - Enhanced `getAllJobs` API endpoint with comprehensive parameter support
  - Server-side filtering for better performance and accuracy
  - Dynamic SQL query building with parameterized queries for security
  - Support for array-based filters (status, salesman)
  - Flexible date range filtering across multiple date fields
  - Amount range filtering with configurable field types
  - Multi-field search with ILIKE pattern matching
- **Technical Features**:
  - **Server-Side Processing**: All filtering done in PostgreSQL for performance
  - **Real-Time Updates**: Debounced search with immediate visual feedback  
  - **Mobile Responsive**: Touch-friendly design with 44px+ touch targets
  - **Accessibility**: Proper ARIA labels, keyboard navigation, screen reader support
  - **Performance Optimized**: Efficient database queries with proper indexing
  - **Type Safety**: Full TypeScript interfaces for all search/filter criteria
- **User Experience**:
  - **Intuitive Interface**: Collapsible panels don't overwhelm the UI
  - **Visual Feedback**: Active filter count badges and removal buttons
  - **Smart Defaults**: Job title search by default, most recent jobs first
  - **Progressive Enhancement**: Basic search works, advanced options available
  - **Filter Memory**: Current search/filter state maintained during session
- **Current Status**: Full advanced search and filtering system operational with professional UI/UX

## UI/UX Standards

### Card Display Guidelines
- **No View Buttons**: All information displayed directly on cards
- **Action Buttons**: Edit and Delete buttons at bottom of cards
- **Button Styling**: Unified action-button styling across all pages (Customers, Salesmen, Products)
  - Edit: Blue background (#3b82f6) with ✏️ icon
  - Delete: White background with red text/border (#dc2626) with 🗑️ icon
  - Consistent hover effects and transitions
- **Notes Format**: Gray background with "Notes:" label, truncated to 100 characters
- **Consistent Styling**: All cards follow same visual hierarchy

### CSS Architecture
- External CSS files with component-scoped styling
- No CSS frameworks (removed Tailwind)
- Modern CSS features (Grid, Flexbox, gradients)
- Common utilities in `/styles/common.css`

### Design System
- **Colors**: Blue (#3b82f6), Purple (#8b5cf6), Green (#10b981), Amber (#f59e0b)
- **Typography**: Clear hierarchy with proper font weights
- **Icons**: Emoji-based iconography throughout
- **Cards**: White background with subtle shadows and hover effects
- **Forms**: Modal-based with proper validation feedback

## Development Guidelines

### Code Standards
- TypeScript strict mode
- React 19 hooks and best practices
- Proper error handling in all API endpoints
- Input validation on both frontend and backend
- Meaningful component and variable names

### Security Considerations
- JWT tokens stored in localStorage
- All API routes require authentication
- Input sanitization and validation
- Parameterized database queries
- Environment variables for sensitive data

### Git Workflow
```bash
# Clone repository
git clone git@github.com:windisch33/craftmart-app.git

# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "Description of changes"
git push origin feature/new-feature
```

## Future Development Opportunities

### Priority Features
1. **Shops Implementation** - Cut sheet generation and management
2. **Reporting System** - Sales and tax reports with export
3. **Job Enhancement Features**:
   - Bulk operations (status updates, exports)
   - Job templates and duplication
   - Customer history and job tracking
   - Enhanced PDF customization options
   - Job timeline and activity tracking

### Enhancement Ideas
- File upload for cut sheets
- Dark mode support
- Export functionality (CSV, Excel)
- Email notifications and automated communications
- Dashboard analytics and reporting widgets
- Mobile app development
- Advanced job scheduling and calendar integration
- Customer portal for job status tracking
- Inventory management integration
- Multi-location support

## Important Files
- `docker-compose.yml` - Service configuration
- `database/init/01-init.sql` - Database schema
- `.env` - Environment configuration
- `CLAUDE.md` - This guide (update after significant changes)
- `outline.txt` - Original project requirements

## Troubleshooting

### Common Issues
1. **Login Issues**: Ensure bcryptjs is installed (not bcrypt)
2. **Blank Pages**: Check browser console for JavaScript errors
3. **API Errors**: Verify JWT token is valid and not expired
4. **Docker Issues**: Run `docker-compose down` then `docker-compose up -d`

### Debug Commands
```bash
# Check service logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres

# Check TypeScript compilation
docker-compose exec frontend npx tsc --noEmit --skipLibCheck

# Restart services
docker-compose restart frontend
docker-compose restart backend
```

Remember: Always check current documentation and read outline.txt before making significant changes or architectural decisions. Update this guide after implementing new features or making architectural changes.