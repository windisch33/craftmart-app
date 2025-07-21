# CraftMart Project - Claude AI Assistant Guide

## Project Overview
CraftMart is a custom staircase manufacturer management system built for 6-10 employees. This web application helps manage customers, jobs (quotes → orders → invoices), shops with cut sheets, and generate sales/tax reports.

## Design Requirements
**Modern, Clean & Readable Design:**
- **Visual Style:** Modern, clean interface that is easy to read and navigate
- **Logo Integration:** Company logo located at `/home/rwindisch/cmi-oe/craftmart-app/Logo.png` should featured in the app design
- **User Experience:** Prioritize clarity, readability, and intuitive navigation for the 6-10 employee team
- **Color Scheme:** Professional, clean color palette suitable for a manufacturing business
- **Typography:** Clear, readable fonts with proper hierarchy and spacing

## Important: Always Reference Current Documentation
**⚠️ CRITICAL:** Before making any changes or recommendations, always consult the current official documentation for the technologies used in this project. Web technologies evolve rapidly, and best practices change frequently.

### Required Reading
1. **ALWAYS read `/home/rwindisch/cmi-oe//craftmart-app/outline.txt`** - Contains the original project requirements and specifications
2. Check current documentation for all major technologies before implementing features

## Tech Stack & Documentation Links

### Backend
- **Node.js 20** - [Current Node.js Docs](https://nodejs.org/docs/latest/)
- **Express.js** - [Express Documentation](https://expressjs.com/)
- **TypeScript** - [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **PostgreSQL** - [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- **Docker** - [Docker Documentation](https://docs.docker.com/)

### Frontend
- **React 19** - [React Documentation](https://react.dev/)
- **TypeScript** - [TypeScript with React](https://www.typescriptlang.org/docs/handbook/react.html)
- **External CSS Modules** - Component-scoped CSS files for maintainable styling
- **React Router** - [React Router Documentation](https://reactrouter.com/)
- **Vite** - [Vite Documentation](https://vitejs.dev/)

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
│   │   ├── pages/          # Route-based page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API integration
│   │   ├── styles/         # Common CSS files and utilities
│   │   └── store/          # State management (Zustand)
├── database/               # PostgreSQL initialization
└── docker-compose.yml     # Development environment
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
```

## Key Features to Implement

### 1. Customer Management
- Full CRUD operations
- Fields: name, address, city, state, zip, phone, mobile, fax, email, accounting_email, notes
- Search and filtering capabilities

### 2. Job Management
- Job lifecycle: Quote → Order → Invoice
- Link jobs to customers
- Track pricing at each stage
- Job status management

### 3. Shop Management
- Create shops from orders
- Generate cut sheets automatically
- Store cut sheet data as JSON
- Link to specific jobs

### 4. Reporting
- Sales reports with date ranges
- Tax reports for accounting
- Export capabilities

## Database Schema

### Customers Table
- Basic contact information
- Notes field for miscellaneous info
- Created/updated timestamps

### Jobs Table
- Customer relationship
- Status tracking (quote/order/invoice)
- Separate amount fields for each stage
- Title and description

### Shops Table
- Job relationship
- Cut sheets stored as JSONB
- Notes for shop-specific information

## API Endpoints

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get specific customer
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Jobs
- `GET /api/jobs` - List all jobs with customer names
- `GET /api/jobs/:id` - Get specific job
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Shops
- `GET /api/shops` - List all shops
- `GET /api/shops/:id` - Get specific shop
- `POST /api/shops` - Create new shop
- `PUT /api/shops/:id` - Update shop
- `DELETE /api/shops/:id` - Delete shop

### Reports
- `GET /api/reports/sales` - Sales report with optional date range
- `GET /api/reports/tax` - Tax report with optional date range

## Development Guidelines

### Always Check Current Documentation First
Before implementing any feature:
1. Read the current official documentation for the technology
2. Check for breaking changes in recent versions
3. Look for new best practices or recommended patterns
4. Verify compatibility between dependencies

### Code Standards
- Use TypeScript strict mode
- Follow React 19 best practices
- Use proper error handling in all API endpoints
- Implement proper validation for all inputs
- Use meaningful component and variable names

### Security Considerations
- Validate all inputs on backend
- Use parameterized queries for database operations
- Implement proper CORS configuration
- Secure file upload handling for cut sheets
- Environment variables for sensitive data

### Testing Strategy
- Test Docker setup works end-to-end
- Verify API endpoints return expected data
- Test frontend routing and navigation
- Validate database constraints and relationships

## Deployment Notes
- Uses Docker for consistent environments
- Easy backup with PostgreSQL volumes
- Can be moved between WSL and Ubuntu VM easily
- Environment variables configured in .env file

## Important Files to Preserve
- `docker-compose.yml` - Service configuration
- `database/init/01-init.sql` - Database schema
- `.env` - Environment configuration (copy from .env.example)
- Both `package.json` files - Dependency management

## Current Status

### ✅ Authentication System (COMPLETED)
- **User Management:** Users table with admin/employee roles
- **JWT Authentication:** Token-based auth with 24-hour expiration
- **Password Security:** Bcrypt hashing with 12 salt rounds
- **Protected Routes:** All API endpoints require authentication
- **Frontend Auth:** React context, protected routes, login/logout
- **Sample Users:** admin@craftmart.com, john.doe@craftmart.com, jane.smith@craftmart.com (all use password: password123)

### ✅ Design Integration Status (COMPLETED)
- **Logo Location:** `/home/rwindisch/cmi-oe/craftmart-app/Logo.png`
- **Logo Integration:** ✅ COMPLETE - Properly integrated across all components
- **Design System:** ✅ COMPLETE - Modern, professional design system implemented
- **UI Components:** ✅ COMPLETE - All components modernized with inline CSS styling

### ✅ CRITICAL ISSUE RESOLVED - LOGIN WORKING
**Status:** FIXED - Login system now working properly
**Root Cause:** bcrypt library incompatibility with Alpine Linux Docker container
**Solution Applied:** Replaced bcrypt with bcryptjs (pure JavaScript implementation)
**Changes Made:**
1. Uninstalled bcrypt package: `npm uninstall bcrypt`
2. Installed bcryptjs and types: `npm install bcryptjs @types/bcryptjs`
3. Updated import in authController.ts: `import bcrypt from 'bcryptjs';`
4. Rebuilt Docker container to include new dependencies
5. Verified authentication works via API test endpoint
**Test Results:** 
- bcryptjs.compare() works correctly in Alpine Linux
- Login API returns JWT token successfully
- No more crashes or "Empty reply from server" errors
**Priority:** COMPLETED

## ✅ Modern UI Implementation Status (COMPLETED)

### **Complete Modern Design System Implementation**
The entire CraftMart application has been transformed with a modern, professional design system using external CSS files for maintainable and organized styling.

### **All Pages & Components Modernized:**

#### **🏠 Core Pages:**
1. **Dashboard** - ✅ Modern Bento grid layout with gradient titles, interactive cards, hover effects
2. **Customers** - ✅ Customer management with search, filters, card-based layout  
3. **Jobs** - ✅ Job lifecycle management with status indicators and pricing breakdown
4. **Shops** - ✅ Production floor management with cut sheet tracking
5. **Reports** - ✅ Comprehensive reporting with quick reports and date range selection
6. **Login** - ✅ Stunning gradient background with glassmorphism card design

#### **🧩 Core Components:**
7. **Header** - ✅ Clean minimalist design with user info and logout
8. **Sidebar** - ✅ Modern navigation with emoji icons and active states

### **🎨 Modern Design Features Implemented:**
- **External CSS Architecture**: Well-organized CSS files for maintainable styling
- **Gradient Titles**: Professional blue-to-purple gradient text across all pages
- **Card-Based Layouts**: Modern white cards with subtle shadows and hover effects
- **Interactive Elements**: Smooth hover transitions and state changes
- **Consistent Color Scheme**: Professional blue (#3b82f6), purple (#8b5cf6), green (#10b981), amber (#f59e0b)
- **Modern Typography**: Clear hierarchy with proper font weights and sizing
- **Responsive Grid Layouts**: Auto-fit grids that adapt to different screen sizes
- **Professional Icons**: Consistent emoji-based iconography throughout
- **Glassmorphism Effects**: Modern backdrop blur and transparency effects (Login page)
- **CSS Animations**: Smooth transitions, hover effects, and loading spinners

### **🔧 Technical Implementation:**
- **External CSS Architecture**: Component-scoped CSS files with Vite build optimization
- **Modern CSS Features**: CSS Grid, Flexbox, gradients, transforms, animations
- **Responsive Design**: Mobile-friendly layouts with proper breakpoints
- **Accessibility**: Proper ARIA labels, focus states, and semantic HTML
- **Performance**: Optimized CSS bundling and minification via Vite

### **📁 Files Updated for Modern UI:**
- `/frontend/src/pages/Dashboard.tsx` - ✅ Modern Bento grid with statistics cards
- `/frontend/src/pages/Customers.tsx` - ✅ Customer management interface
- `/frontend/src/pages/Jobs.tsx` - ✅ Job lifecycle management system
- `/frontend/src/pages/Shops.tsx` - ✅ Production floor management
- `/frontend/src/pages/Reports.tsx` - ✅ Comprehensive reporting interface
- `/frontend/src/pages/Login.tsx` - ✅ Stunning glassmorphism login design
- `/frontend/src/components/common/Header.tsx` - ✅ Modern header component
- `/frontend/src/components/common/Sidebar.tsx` - ✅ Modern navigation sidebar
- `/frontend/index.html` - ✅ Updated title and favicon

### **🚀 Design System Benefits:**
- **Maintainability**: External CSS files allow for easy updates and organization
- **Performance**: Optimized CSS bundling and caching via Vite build process
- **Scalability**: Component-scoped CSS files make it easy to add new features
- **Consistency**: Unified design patterns across all pages with shared common styles
- **Modern Aesthetic**: Professional appearance suitable for manufacturing business

## 🔮 Future Development Opportunities
1. **Enhanced Functionality**
   - Implement file upload for cut sheets
   - Add form validation on frontend  
   - Add export functionality for reports
   - Create comprehensive test suite
   - Add logging and monitoring

2. **Advanced Features**
   - Dark mode support
   - Advanced animations and micro-interactions
   - Real-time notifications
   - Advanced search and filtering
   - Mobile app development

3. **Business Features**
   - Advanced reporting analytics
   - Customer portal integration
   - Inventory management
   - Time tracking for jobs
   - Integration with accounting software

## 🏗️ Architecture Notes
- **CSS Architecture**: Uses external CSS files with component-scoped styling for maintainability
- **No CSS Framework**: Completely eliminated Tailwind CSS and all related dependencies  
- **Component-First Design**: Each component has its own dedicated CSS file for organization
- **Modern CSS**: Leverages native CSS features like Grid, Flexbox, gradients, and animations
- **Common Utilities**: Shared styles in `/styles/common.css` for consistent patterns across components
- **Clean Codebase**: Removed all unused UI components, icons, and Tailwind configuration files

### **CSS File Structure:**
```
frontend/src/
├── styles/
│   ├── common.css          # Shared utilities and common styles
│   └── App.css            # App-level layout styles
├── pages/
│   ├── Login.css          # Login page styles
│   ├── Dashboard.css      # Dashboard page styles
│   ├── Customers.css      # Customers page styles
│   ├── Jobs.css           # Jobs page styles
│   ├── Shops.css          # Shops page styles
│   └── Reports.css        # Reports page styles
└── components/
    └── common/
        ├── Header.css     # Header component styles
        └── Sidebar.css    # Sidebar component styles
```

## 🧹 Cleanup Completed
- ✅ Removed `tailwind.config.js`
- ✅ Removed `postcss.config.js` 
- ✅ Updated `index.css` with modern CSS reset and base styles
- ✅ Cleaned up `package.json` dependencies (removed Tailwind CSS, PostCSS, autoprefixer, clsx, tailwind-merge)
- ✅ Refactored all components from inline CSS to external CSS files
- ✅ Created component-scoped CSS files for maintainable styling
- ✅ Removed unused `/components/ui/` folder (Button, Card, Input components)
- ✅ Removed unused `/components/icons/` folder (custom SVG icons)
- ✅ Removed backup App files and unused CSS files
- ✅ Reinstalled dependencies for clean setup

## 📋 Development Guidelines
- **Styling**: Use external CSS files with component-scoped classes for new components
- **Design Consistency**: Follow established color scheme and typography patterns in `common.css`
- **Icons**: Use emoji icons for consistency across the application
- **Animations**: Implement smooth transitions and hover effects using CSS
- **Responsiveness**: Ensure all new features work across device sizes
- **CSS Organization**: Create dedicated CSS files for new components following the established structure

## 🐙 GitHub Repository

**Repository Information:**
- **Owner:** windisch33
- **Email:** windisch33@gmail.com
- **SSH Key:** Ed25519 key configured for secure Git operations
- **Repository URL:** `git@github.com:windisch33/craftmart-app.git`
- **Branch:** `main` (default)

### Git Setup Status:
- ✅ Git repository initialized
- ✅ SSH key generated and configured
- ✅ GitHub SSH authentication ready
- ✅ Initial commit completed (72 files, 16,258 insertions)
- ✅ `.gitignore` configured for Node.js/React/Docker project

### Git Workflow Commands:
```bash
# Clone repository
git clone git@github.com:windisch33/craftmart-app.git

# Development workflow
git checkout -b feature/new-feature
git add .
git commit -m "Description of changes"
git push origin feature/new-feature

# Connect local repository (if not cloned)
git remote add origin git@github.com:windisch33/craftmart-app.git
git push -u origin main
```

Remember: Always check current documentation and read outline.txt before making significant changes or architectural decisions. Always update CLAUDE.md after changes to reflect current state. 