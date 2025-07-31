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
│   │   │   ├── products/   # Product-specific components (HandrailForm, LandingTreadForm, RailPartsForm, MaterialForm)
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
- **Base Products Table**: Core product information with type constraints (handrail, landing_tread, rail_parts, newel, baluster, other)
- **Handrail Products Table**: Per 6-inch segment pricing with labor costs (cost_per_6_inches, labor_install_cost)
- **Landing Tread Products Table**: Per 6-inch segment pricing for treads (cost_per_6_inches, labor_install_cost)
- **Rail Parts Products Table**: Base price with material multipliers for discrete parts (base_price, labor_install_cost)
- **Materials Table**: Wood types and other materials with pricing multipliers (name, multiplier, color, description)
- **Quote Items Table**: Job line items with product references, quantities, pricing, and tax status

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
- `GET /api/products` - List all products with optional type filtering
- `GET /api/products/handrails` - List handrail products
- `POST /api/products/handrails` - Create handrail product
- `PUT /api/products/handrails/:id` - Update handrail product
- `GET /api/products/landing-treads` - List landing tread products
- `POST /api/products/landing-treads` - Create landing tread product
- `PUT /api/products/landing-treads/:id` - Update landing tread product
- `GET /api/products/rail-parts` - List rail parts products
- `POST /api/products/rail-parts` - Create rail parts product
- `PUT /api/products/rail-parts/:id` - Update rail parts product
- `GET /api/products/:id` - Get specific product
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

### ✅ Multi-Product Catalog System (COMPLETED)
- **Hanrail Products**: Per 6-inch pricing with length calculations and material multipliers
- **Landing Tread Products**: Per 6-inch pricing like handrails for tread components (6", 8", etc.)
- **Rail Parts Products**: Base price + material multiplier for discrete components (end caps, brackets, connectors)
- **Materials Management**: Wood types with pricing multipliers (Pine 1.0x, Oak 1.0x, Cherry 1.5x, etc.)  
- **Unified Pricing System**: Consistent calculation logic across all product types
- **Optional Labor Costs**: Each product can include installation/labor charges
- **Full CRUD Operations**: Complete management interface for all product types

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

### ✅ UI Standardization & Mobile Responsiveness Overhaul (COMPLETED - July 24, 2025)
- **Feature Delivered**: Comprehensive CSS standardization and mobile-first responsive design across entire application
- **CSS Standardization Achievements**:
  - **Unified Headers**: All pages standardized to use `.gradient-title` class with consistent blue-to-purple gradient
  - **Button Consistency**: All primary buttons unified with `.btn .btn-primary` classes and consistent hover effects
  - **Layout Standardization**: Implemented `.page-header` structure across all major pages with proper flex layout
  - **Navigation Improvements**: Reordered menu to Customers-Jobs-Products-Shops-Reports-Salesmen for better workflow
  - **Content Updates**: Updated Products subtitle from "handrail" to general "products and materials" for scalability
  - **Action Button Alignment**: Moved Create/Add/Refresh buttons to right-side alignment matching Shops page pattern
- **Mobile Responsiveness Enhancements**:
  - **SelectableList Component**: Complete mobile optimization with card-style layout on mobile devices
  - **Touch Target Optimization**: All interactive elements meet 44px minimum touch target requirement
  - **Content Display Fixes**: Resolved mobile list content cutoff issues with proper text wrapping and overflow handling
  - **Mobile Layout Improvements**: Enhanced padding, spacing, and visual hierarchy for mobile devices
  - **Responsive Breakpoints**: Standardized 768px and 480px breakpoints across all components
  - **Mobile Checkbox Positioning**: Optimized checkbox placement with proper spacing from content text
- **Component Architecture Improvements**:
  - **Responsive List Design**: SelectableList supports both desktop table view and mobile card-style display
  - **Mobile-First Approach**: All new CSS written mobile-first with progressive enhancement
  - **Common CSS Consolidation**: Centralized shared styles in `common.css` eliminating code duplication
  - **Data Label Attributes**: Added proper mobile labels for all list cell content
  - **Touch-Friendly Navigation**: Enhanced mobile menu and action buttons with proper touch zones
- **Technical Implementation**:
  - **CSS Architecture**: Consolidated from page-specific styles to shared common.css patterns
  - **Mobile Card Layout**: Individual mobile list items styled as cards with subtle shadows and rounded corners
  - **Flexible Grid System**: Responsive layouts that adapt gracefully across all device sizes
  - **Performance Optimization**: Reduced CSS duplication and improved maintainability
- **Current Status**: Comprehensive UI standardization and mobile responsiveness implemented across all pages

### ✅ Search-Focused Page Transformations (COMPLETED - July 25, 2025)
- **Feature Delivered**: Transformed Customers and Jobs pages from list-based to search-focused card interfaces
- **Customer Page Transformation**:
  - **Search-First Design**: Large, auto-focused search bar as primary interaction method
  - **Recent Visitors**: Shows last 10 visited customers instead of loading all customers
  - **Visit Tracking**: Automatic customer visit tracking with `last_visited_at` database field
  - **Card Layout**: Responsive grid layout (3→2→1 columns) with comprehensive customer details
  - **Database Migration**: Added `database/migrations/04-add-customer-last-visited.sql` with indexing
  - **API Enhancement**: New `getRecentCustomers()` endpoint with `?recent=true` parameter
- **Jobs Page Transformation**:
  - **Search-First Design**: Large search bar with real-time search across all job fields
  - **Recent Jobs**: Shows last 10 recently updated jobs instead of loading all jobs
  - **Card Layout**: Professional job cards with status badges, amounts, and action buttons
  - **Advanced Filters Preserved**: Collapsible panel maintains all existing filtering capabilities
  - **API Enhancement**: New `getRecentJobs()` endpoint leveraging existing `updated_at` field
- **Technical Implementation**:
  - **Backend Enhancements**: Added `?recent=true` support in customerController and jobController
  - **Database Optimization**: Efficient recent data queries with proper indexing
  - **Mobile-First Design**: Touch-friendly cards with 44px+ touch targets
  - **Search Integration**: Real-time search with backend integration for both pages
  - **Critical Bug Fix**: Resolved `TypeError: Assignment to constant variable` in jobController
- **User Experience Improvements**:
  - **Faster Page Loads**: Only loads 10 recent items instead of entire datasets
  - **Immediate Search**: Auto-focused search bars for instant user interaction
  - **Visual Feedback**: Clear indicators for recent vs. search results
  - **Progressive Enhancement**: Search functionality works seamlessly with existing features
- **Current Status**: Both pages successfully transformed with search-focused interfaces and improved performance

### ✅ UI Refinements and Salesmen Page Alignment (COMPLETED - July 28, 2025)
- **Feature Delivered**: Aligned Salesmen page with Customers page design and removed delete functionality
- **Salesmen Page Updates**:
  - **Layout Alignment**: Changed from `page-container` to `container` class matching Customers page
  - **Search Bar Transformation**: Converted to large centered search bar with `search-container-large`
  - **Removed Refresh Button**: Simplified interface to match Customers page (only Add button remains)
  - **Card Styling**: Updated to use `customer-card` classes for visual consistency
  - **Removed Status Badges**: Eliminated active/inactive badges for cleaner card design
  - **Import Updates**: Added `common.css` import for shared styling
- **Customers Page Updates**:
  - **Delete Button Removal**: Removed delete functionality for safer data management
  - **Simplified Actions**: Now only shows Edit button on customer cards
- **Technical Implementation**:
  - **CSS Consolidation**: Reused existing customer CSS classes for salesmen
  - **Component Consistency**: Both pages now follow identical layout patterns
  - **Code Cleanup**: Removed unused delete handler functions
- **User Experience Improvements**:
  - **Safer Data Management**: Prevents accidental deletion of customers
  - **Consistent Navigation**: Users experience the same interface patterns across pages
  - **Cleaner Cards**: Salesmen cards focus on essential information without status clutter
- **Current Status**: UI consistency achieved across Customers and Salesmen pages

### ✅ Landing Treads and Rail Parts Product System (COMPLETED - July 30, 2025)
- **Feature Delivered**: Expanded product catalog with two new product types beyond handrails
- **Landing Tread Products Implementation**:
  - **Database Schema**: Created `landing_tread_products` table with per-6-inch pricing model
  - **Pricing Model**: Same as handrails - length-based calculations with material multipliers
  - **Sample Products**: 6" Landing Tread with $35/6" base cost and $125 labor option
  - **Form Component**: `LandingTreadForm.tsx` with consistent styling and validation
  - **API Endpoints**: Full CRUD operations (`/api/products/landing-treads`)
  - **Migration Applied**: `database/migrations/05-add-landing-tread-product-type.sql`
- **Rail Parts Products Implementation**:
  - **Database Schema**: Created `rail_parts_products` table with base price model
  - **Pricing Model**: Base price × material multiplier × quantity (no length calculations)
  - **Sample Products**: End Cap ($15), Mounting Bracket ($12.50), Joint Connector ($8)
  - **Form Component**: `RailPartsForm.tsx` with base price and labor cost inputs
  - **API Endpoints**: Full CRUD operations (`/api/products/rail-parts`)
  - **Migration Applied**: `database/migrations/06-add-rail-parts-product-type.sql`
- **Product Selector Enhancement**:
  - **Multi-Product Support**: Updated `ProductSelector.tsx` to handle all three product types
  - **Pricing Calculations**: Separate calculation logic for each product type
  - **Material Requirements**: Smart material selector based on product type compatibility
  - **UI Organization**: Products grouped by type in dropdown (Hanrails, Landing Treads, Rail Parts)
- **Products Page Enhancement**:
  - **Tab Interface**: Added Landing Treads and Rail Parts tabs with 🪜 and 🔩 icons
  - **Consistent UX**: All product types follow same CRUD patterns and form layouts
  - **Tab Labels**: Updated "Hanrail Products" to "Hanrail" for consistency
- **Technical Architecture**:
  - **Polymorphic Pricing**: Three distinct pricing models unified under common interface
  - **Type Safety**: Full TypeScript interfaces for all product request/response types
  - **Database Constraints**: Proper foreign keys and validation for all product tables
  - **Route Organization**: Specific routes before generic to prevent path conflicts
- **Current Status**: Complete multi-product catalog system operational with three product types

## UI/UX Standards

### Design System (Updated July 24, 2025)
- **Colors**: 
  - Primary Blue (#3b82f6) - Buttons, links, primary actions
  - Purple (#8b5cf6) - Gradient accents, secondary highlights  
  - Green (#10b981) - Success states, positive indicators
  - Amber (#f59e0b) - Warning states, pending indicators
  - Red (#dc2626) - Error states, delete actions
- **Typography**: 
  - Gradient headers with blue-to-purple linear gradient
  - Clear hierarchy with proper font weights (400, 500, 600, 700)
  - Consistent font sizing across breakpoints
- **Icons**: Emoji-based iconography throughout for universal accessibility
- **Layout**: 
  - `.page-header` structure for consistent page layouts
  - Flex-based responsive containers
  - 16px, 24px, 32px spacing scale

### Component Standards
- **SelectableList**: Unified list/table component with mobile card layouts
  - Desktop: Table view with hover states and selection
  - Mobile: Card-based layout with touch-friendly interactions
  - Bulk operations toolbar for multi-select actions
- **Buttons**: 
  - `.btn` base class with size and spacing standards
  - `.btn-primary`, `.btn-secondary`, `.btn-danger` variants
  - Minimum 44px height for touch accessibility
  - Consistent hover effects and transitions
- **Forms**: 
  - Modal-based with proper validation feedback
  - Mobile-responsive with proper input sizing
  - Consistent error and success state styling
- **Cards**: 
  - White background with subtle shadows (0 1px 3px rgba(0,0,0,0.1))
  - 8px border radius for modern appearance
  - Hover effects with transform and shadow changes

### CSS Architecture (Refactored July 24, 2025)
- **common.css**: Centralized shared styles and utilities
- **Component-scoped CSS**: External CSS files paired with components
- **Mobile-First**: Responsive design with 768px and 480px breakpoints
- **No CSS Frameworks**: Custom CSS architecture for maintainability
- **Modern CSS Features**: Grid, Flexbox, custom properties, gradients
- **Consistent Naming**: BEM-inspired class naming with semantic prefixes

### Mobile Responsiveness Standards
- **Touch Targets**: Minimum 44px for all interactive elements
- **Breakpoints**: 768px (tablet), 480px (mobile) consistently applied
- **Navigation**: Hamburger menu with touch-friendly interactions
- **Content**: Card-based layouts on mobile with proper text wrapping
- **Forms**: Full-width inputs with appropriate sizing for mobile keyboards
- **Lists**: Transform from table to card layout with data-label attributes

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
1. **Shops Implementation** - Cut sheet generation and management (highest priority missing feature)
2. **Reporting System** - Sales and tax reports with frontend interfaces and export functionality
3. **Dashboard Implementation** - Analytics overview with recent jobs, quick actions, and business metrics
4. **Database Performance Optimization** - Add recommended indexes for better query performance
5. **Job Enhancement Features**:
   - Job templates and duplication for common quotes
   - Customer history and comprehensive job tracking
   - Enhanced PDF customization options and branding
   - Job timeline and activity tracking with audit logs

### Technical Improvements
- **CSS Custom Properties**: Implement design tokens for easier theming and maintenance
- **Audit Logging**: Add change tracking for critical business data (jobs, quote items, customers)
- **Database Indexes**: Add missing performance indexes for better query optimization
- **Timezone Handling**: Migrate to TIMESTAMPTZ for proper timezone awareness
- **Error Boundaries**: Implement comprehensive error handling across all components

### Enhancement Ideas
- **File Upload System**: Cut sheet uploads and document management
- **Dark Mode Support**: Theme toggle with persistent user preferences  
- **Advanced Export**: CSV, Excel export functionality with customizable fields
- **Email Notifications**: Automated communications for job status changes
- **Mobile App**: React Native or PWA development for mobile access
- **Advanced Scheduling**: Calendar integration and job scheduling system
- **Customer Portal**: External access for customers to view job status
- **Inventory Management**: Product stock tracking and material management
- **Multi-Location Support**: Branch/location management for larger operations

## Important Files
- `docker-compose.yml` - Service configuration and container orchestration
- `database/init/01-init.sql` - Complete database schema with sample data
- `database/migrations/02-enhance-jobs-table.sql` - Jobs system enhancements migration
- `README.md` - Comprehensive project documentation and setup guide
- `.env` - Environment configuration variables
- `CLAUDE.md` - This technical guide (update after significant changes)
- `IMPLEMENTATION_PLAN.md` - Development roadmap and feature tracking
- `PRODUCT_MANAGEMENT_PLAN.md` - Product development workflow documentation
- `outline.txt` - Original project requirements and specifications

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

## Database Best Practices Assessment (Added July 24, 2025)

### ✅ Current Database Health (8.5/10)
- **Excellent**: Proper foreign key relationships, good normalization (3NF), appropriate data types
- **Strong**: 26 indexes supporting query performance, proper constraints for data validation
- **Production Ready**: Well-designed schema supporting all business requirements

### 📈 Recommended Performance Improvements
```sql
-- Missing indexes for better query performance (recommended):
CREATE INDEX idx_jobs_salesman_id ON jobs(salesman_id);           -- Salesman filtering  
CREATE INDEX idx_jobs_created_at ON jobs(created_at);             -- Date range queries
CREATE INDEX idx_jobs_delivery_date ON jobs(delivery_date);       -- Scheduling queries
CREATE INDEX idx_quote_items_section_id ON quote_items(section_id); -- Section queries
CREATE INDEX idx_tax_rates_state_code ON tax_rates(state_code);   -- State tax lookups
```

### 🔧 Optional Enhancements
- **Timezone Awareness**: Consider TIMESTAMPTZ for multi-timezone support
- **Audit Logging**: Add change tracking for critical business data
- **Enhanced Validation**: Email format and state code validation constraints

---

## Project Status Summary (Updated July 30, 2025)

### ✅ **Completed Major Features**
- Complete customer and salesmen management with advanced search
- Comprehensive job system with PDF generation and sections-based organization  
- Advanced search and filtering with server-side processing
- Search-focused page transformations with card-based interfaces and recent data loading
- Mobile-first responsive design with touch optimization
- UI standardization and CSS architecture refactoring
- UI refinements with consistent Customers/Salesmen page layouts
- **Multi-Product Catalog System** - Handrails, Landing Treads, and Rail Parts with unified pricing
- Production deployment with enterprise security (Cloudflare Tunnel)

### 🚧 **Next Priority Items**
1. **Shops Implementation** - Cut sheet generation and management
2. **Reports Frontend** - Sales and tax reports with export functionality
3. **Dashboard** - Analytics overview with business metrics
4. **Database Optimization** - Add recommended performance indexes

### 📊 **Project Health**
- **Architecture**: Excellent (well-normalized database, proper component structure)
- **UI/UX**: Excellent (consistent design system, mobile-optimized)
- **Performance**: Good (well-indexed database, optimized queries)  
- **Security**: Excellent (JWT auth, parameterized queries, zero-trust deployment)
- **Maintainability**: Excellent (TypeScript, component architecture, documentation)

---

Remember: Always check current documentation and read outline.txt before making significant changes or architectural decisions. Update this guide after implementing new features or making architectural changes.

*Last Updated: July 30, 2025 - Landing Treads and Rail Parts Product System Implementation*