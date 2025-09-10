# CraftMart 🏗️

A comprehensive staircase manufacturing management system designed for small-to-medium manufacturing businesses (6-10 employees). Built with modern web technologies and optimized for both desktop and mobile use.

**🌐 Live Production Site**: [https://www.cmioe.com](https://www.cmioe.com)

## ✨ Features

### **Core Business Management**
- 👥 **Customer Management** - Complete customer database with contact information and job history
- 📋 **Advanced Job System** - Quote → Order → Invoice workflow with real-time status tracking
- 👨‍💼 **Salesmen Management** - Commission tracking, performance metrics, and assignment management
- 🔧 **Multi-Product Catalog** - Handrails, Landing Treads, Rail Parts with materials and dynamic pricing system
- 🏭 **Shop Management** - Cut sheet generation and manufacturing workflow (planned)

### **Advanced Job Features**
- 📄 **Professional PDF Generation** - Custom job documents with company branding
- 🔍 **Advanced Search & Filtering** - Multi-field search with date ranges and amount filters
- 💰 **Real-time Tax Calculations** - State-based tax rates with material/labor segregation
- 📊 **Section-based Organization** - Jobs organized by location (Basement, Main Floor, etc.)
- 📱 **Mobile-First Design** - Fully responsive interface optimized for mobile devices

### **Modern UI/UX**
- 🎨 **Consistent Design System** - Unified styling with gradient headers and standardized components
- 📱 **Mobile Responsive** - Touch-friendly interface with 44px+ touch targets
- 🔄 **Bulk Operations** - Multi-select with bulk delete, export, and status updates
- ⚡ **Real-time Updates** - Live calculations and instant feedback
- 🔐 **JWT Authentication** - Secure user sessions with role-based access

## 🚀 Quick Start

### **Production Access**
Visit [https://www.cmioe.com](https://www.cmioe.com) and login with:
- **Admin**: admin@craftmart.com / password123
- **User**: john.doe@craftmart.com / password123

### **Local Development**
```bash
# Clone the repository
git clone git@github.com:windisch33/craftmart-app.git
cd craftmart-app

# Start with Docker (recommended)
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Database: localhost:5432
```

## 🛠️ Development

### **Prerequisites**
- Docker and Docker Compose (recommended)
- Node.js 20+ and npm (for local development)
- PostgreSQL 13+ (if running locally)

### **Environment Setup**
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Update with your configuration
# Database credentials, JWT secrets, etc.
```

### **Configuration Reference**

The application requires environment-specific configuration for security and performance. Use this reference table to configure your environment:

| Environment Variable | Development | Staging | Production | Description |
|---------------------|-------------|---------|------------|-------------|
| `NODE_ENV` | `development` | `staging` | `production` | Application environment |
| `CORS_ORIGIN` | `http://localhost:3000,http://127.0.0.1:3000` | `https://staging.yourdomain.com` | `https://yourdomain.com,https://www.yourdomain.com` | Comma-separated allowed origins |
| `JWT_SECRET` | `dev-secret-key-min-16-chars` | `staging-32char-random-string...` | `production-secure-32char+...` | Secure random string (32+ chars in prod) |
| `RATE_LIMIT_MAX` | `10` | `5` | `5` | Max login attempts per window |
| `RATE_LIMIT_WINDOW_MS` | `300000` (5 min) | `900000` (15 min) | `900000` (15 min) | Rate limit window duration |
| `PDF_CACHE_DIR` | `/tmp/craftmart-pdf-cache` | `/var/cache/craftmart-pdf` | `/var/cache/craftmart-pdf` | PDF cache directory |
| `DB_PASSWORD` | `dev_password` | `secure_staging_password` | `very_secure_production_password` | Database password |

#### **Environment-Specific Examples**

**Development (.env)**:
```bash
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
JWT_SECRET=development-secret-key-min-16-chars
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_MS=300000
PDF_CACHE_DIR=/tmp/craftmart-pdf-cache
```

**Production (.env)**:
```bash
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
JWT_SECRET=super-secure-production-jwt-secret-32-characters-minimum
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW_MS=900000
PDF_CACHE_DIR=/var/cache/craftmart-pdf
```

#### **Security Guidelines**

**🔐 Authentication & Secrets**:
- **JWT Secrets**: Must be 32+ characters in production, random and unique
- **Database Passwords**: Use strong, unique passwords for each environment
- **Never commit secrets**: Keep production secrets out of version control

**🌐 CORS Configuration**:
- **Development**: Include both localhost and 127.0.0.1 for flexibility
- **Staging**: Single staging domain only
- **Production**: Only necessary production domains (www and non-www)

**⚡ Rate Limiting**:
- **Development**: Higher limits (10 attempts) for easier testing
- **Production**: Stricter limits (5 attempts) for security
- **Window**: 15 minutes standard, 5 minutes acceptable for development

**📁 File System**:
- **Development**: System temp directory for easy cleanup
- **Production**: Dedicated cache directory with proper permissions
- **Staging**: Mirror production configuration for accurate testing

### **Local Development**
```bash
# Backend development
cd backend
npm install
npm run dev        # Starts on port 3001

# Frontend development  
cd frontend
npm install
npm run dev        # Starts on port 3000

# Database operations
docker-compose exec postgres psql -U craftmart_user -d craftmart

# Apply database migrations
docker-compose exec -T postgres psql -U craftmart_user -d craftmart < database/migrations/02-enhance-jobs-table.sql
```

### **Docker Commands**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres

# Restart specific service
docker-compose restart frontend

# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🏗️ Architecture

### **Technology Stack**
- **Frontend**: React 19, TypeScript, Vite, External CSS modules
- **Backend**: Node.js 20, Express.js, TypeScript, bcryptjs
- **Database**: PostgreSQL 13 with comprehensive schema
- **Infrastructure**: Docker, Nginx reverse proxy, Cloudflare Tunnel
- **Security**: JWT authentication, parameterized queries, CORS protection

### **Project Structure**
```
craftmart-app/
├── frontend/                   # React TypeScript application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── common/        # Shared components (SelectableList, Sidebar)
│   │   │   ├── customers/     # Customer-specific components
│   │   │   ├── jobs/          # Job management components
│   │   │   └── salesmen/      # Salesmen management components
│   │   ├── pages/             # Route-based page components
│   │   ├── services/          # API integration services
│   │   ├── styles/            # Common CSS and utilities
│   │   └── utils/             # Helper functions and calculations
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── controllers/       # API endpoint handlers
│   │   ├── routes/            # Express route definitions
│   │   ├── services/          # Business logic (PDF generation, etc.)
│   │   ├── middleware/        # Authentication and validation
│   │   └── config/            # Database and environment config
├── database/                   # PostgreSQL schema and migrations
│   ├── init/                  # Initial database setup
│   └── migrations/            # Database schema updates
├── nginx/                      # Reverse proxy configuration
├── cloudflared/               # Cloudflare Tunnel setup
└── docker-compose.yml         # Multi-container orchestration
```

## 🎨 Theming
- Primary color, gradients, and focus rings are defined in `frontend/src/styles/variables.css`.
- Most UI uses CSS variables (`--color-primary`, `--color-primary-hover`, `--gradient-primary`).
- To change the app’s look:
  1) Edit the primary ramp and semantic tokens in `variables.css` (see THEME_MIGRATION.md presets)
  2) Hard refresh the browser (Ctrl/Cmd+Shift+R) or run `cd frontend && npm run build`
- Reference: `THEME_MIGRATION.md` for progress, remaining files, and ready-to-paste color presets.

## 🧩 Accessibility
- Modals use a shared, accessible wrapper (`AccessibleModal`):
  - Traps focus, restores focus on close, Escape to close, backdrop click optional
  - Applies `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`
  - Refactored: Job Detail, Project Detail, Project Form, Job Form, PDF Preview, Next Stage Confirm, Customer Jobs, Users Reset Password, Stair forms
  - See AGENTS.md for usage details

## 🗄️ Database Schema

### **Core Tables**
- **users** - Authentication and user management
- **customers** - Client information and contact details
- **salesmen** - Sales team with commission tracking
- **jobs** - Main job records with status progression
- **job_sections** - Location-based job organization
- **quote_items** - Detailed product line items
- **products** - Multi-type product catalog (handrails, landing_treads, rail_parts)
- **handrail_products** - Per-6-inch pricing for handrail products
- **landing_tread_products** - Per-6-inch pricing for landing treads
- **rail_parts_products** - Base price + multiplier for discrete parts
- **materials** - Material types with cost multipliers
- **tax_rates** - State-based tax rate lookup

### **Key Relationships**
- Jobs → Customers (many-to-one)
- Jobs → Salesmen (many-to-one)
- Jobs → Job Sections (one-to-many)
- Job Sections → Quote Items (one-to-many)
- Quote Items → Products/Materials (many-to-one)

## 🔌 API Reference

### **Authentication**
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - Current user profile

### **Customer Management**
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### **Job Management**
- `GET /api/jobs` - Advanced job search with filtering
- `POST /api/jobs` - Create job with automatic tax calculation
- `GET /api/jobs/:id/pdf` - Generate and download job PDF
- `POST /api/jobs/:id/sections` - Create job sections
- `POST /api/jobs/:jobId/sections/:sectionId/items` - Add quote items

### **Salesmen Management**
- `GET /api/salesmen` - List salesmen with statistics
- `POST /api/salesmen` - Create new salesman
- `GET /api/salesmen/search` - Search salesmen by name

### **Products & Materials**
- `GET /api/products` - Product catalog with type filtering (hanrail, landing_tread, rail_parts)
- `GET /api/products/handrails` - Handrail products with per-6-inch pricing
- `GET /api/products/landing-treads` - Landing tread products with per-6-inch pricing  
- `GET /api/products/rail-parts` - Rail parts products with base price + material multiplier
- `GET /api/materials` - Material types with pricing multipliers

## 🚀 Production Deployment

### **Current Production Setup**
- **Domain**: https://www.cmioe.com
- **Infrastructure**: Cloudflare Tunnel with zero-trust network access
- **SSL/TLS**: Automatic HTTPS via Cloudflare
- **Security**: No exposed ports, all traffic through secure tunnels
- **Performance**: Global CDN with DDoS protection

### **Deployment Process**
1. **Code Changes**: Develop on feature branches
2. **Testing**: Verify functionality in development environment
3. **Docker Build**: Rebuild containers with latest changes
4. **Production Deploy**: Update production containers via Cloudflare Tunnel

## 🔧 Configuration

### **Environment Variables**
```bash
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=craftmart
DB_USER=craftmart_user
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://www.cmioe.com

# Cloudflare Tunnel (Production)
TUNNEL_TOKEN=your_tunnel_token
```

### **Development vs Production**
- **Development**: docker-compose.yml with hot reload
- **Production**: Optimized builds with Cloudflare Tunnel
- **Database**: Persistent volumes for data preservation
- **Security**: Environment-specific JWT secrets and CORS settings

## 🧪 Testing

### **Manual Testing Checklist**
- [ ] User authentication and session management
- [ ] Customer CRUD operations
- [ ] Job creation with sections and products
- [ ] PDF generation and download
- [ ] Salesmen management and statistics
- [ ] Mobile responsiveness across all pages
- [ ] Search and filtering functionality

### **Database Testing**
```bash
# Test database connection
docker-compose exec postgres psql -U craftmart_user -d craftmart -c "SELECT COUNT(*) FROM customers;"

# Verify schema
docker-compose exec postgres psql -U craftmart_user -d craftmart -c "\\dt"
```

## 📈 Current Status

### **✅ Completed Features**
- Complete customer and salesmen management
- Advanced job system with PDF generation
- Mobile-responsive design with touch optimization
- Advanced search and filtering system
- Professional UI with consistent design system
- Production deployment with enterprise security

### **🚧 In Development**
- Shops implementation with cut sheet generation
- Enhanced reporting system with analytics
- Job templates and bulk operations

### **📋 Planned Features**
- Dashboard with business analytics
- Email notification system
- Advanced inventory management
- Customer portal access
- Dark mode support

## 🤝 Contributing

### **Development Workflow**
1. Create feature branch from `main`
2. Make changes following TypeScript/React best practices
3. Test thoroughly in development environment
4. Create pull request with detailed description
5. Code review and merge to main
6. Deploy to production

### **Code Standards**
- **TypeScript**: Strict type checking enabled
- **React**: Functional components with hooks
- **CSS**: External CSS modules with mobile-first approach
- **Backend**: Express.js with comprehensive error handling
- **Database**: Parameterized queries for security

## 📞 Support

For technical support or questions:
- Check the `CLAUDE.md` file for detailed technical documentation
- Review the `IMPLEMENTATION_PLAN.md` for development roadmap
- Create GitHub issues for bug reports or feature requests

## 📄 License

Private repository - All rights reserved to CraftMart Manufacturing.
