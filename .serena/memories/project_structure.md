# CraftMart Project Structure

## Root Directory
```
craftmart-app/
├── backend/                  # Node.js/Express API server
├── frontend/                 # React application
├── database/                 # PostgreSQL setup and migrations
├── nginx/                    # Reverse proxy configuration
├── cloudflared/             # Cloudflare Tunnel config
├── docker-compose.yml       # Container orchestration
├── .env.example             # Environment template
├── README.md                # Project documentation
├── CLAUDE.md                # AI assistant guide
├── Logo.png                 # Company logo asset
└── outline.txt              # Original requirements
```

## Backend Structure
```
backend/
├── src/
│   ├── server.ts           # Express server entry point
│   ├── controllers/        # Request handlers
│   │   ├── authController.ts
│   │   ├── customerController.ts
│   │   ├── jobController.ts
│   │   ├── productController.ts
│   │   ├── reportController.ts
│   │   └── salesmanController.ts
│   ├── routes/            # API route definitions
│   ├── middleware/        # Auth and error handling
│   ├── services/          # Business logic layer
│   │   └── pdfService.ts  # PDF generation
│   ├── config/            # Database configuration
│   └── utils/             # Helper functions
├── uploads/               # File storage
├── package.json
└── tsconfig.json
```

## Frontend Structure
```
frontend/
├── src/
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # React entry point
│   ├── components/        # UI components
│   │   ├── common/        # Shared components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── SelectableList.tsx
│   │   ├── customers/     # Customer components
│   │   │   └── CustomerForm.tsx
│   │   ├── salesmen/      # Salesman components
│   │   │   └── SalesmanForm.tsx
│   │   └── jobs/          # Job components
│   │       ├── JobForm.tsx
│   │       ├── JobDetail.tsx
│   │       ├── JobPDFPreview.tsx
│   │       ├── AdvancedSearchBar.tsx
│   │       ├── FilterPanel.tsx
│   │       └── SortControls.tsx
│   ├── pages/             # Route pages
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Customers.tsx
│   │   ├── Jobs.tsx
│   │   ├── Products.tsx
│   │   ├── Salesmen.tsx
│   │   └── Reports.tsx
│   ├── services/          # API integration
│   │   ├── api.ts         # Axios setup
│   │   ├── authService.ts
│   │   ├── customerService.ts
│   │   └── jobService.ts
│   ├── store/             # Zustand state
│   │   └── authStore.ts
│   ├── styles/            # CSS files
│   │   ├── common.css     # Shared styles
│   │   └── [component].css # Component styles
│   └── hooks/             # Custom React hooks
├── public/                # Static assets
├── package.json
├── tsconfig.json
├── eslint.config.js
└── vite.config.ts
```

## Database Structure
```
database/
├── init/
│   └── 01-init.sql       # Complete schema with sample data
└── migrations/           # Schema updates
    └── 02-enhance-jobs-table.sql
```

## Key Design Patterns
- **Separation of Concerns**: Controllers → Services → Database
- **Component Organization**: Feature-based grouping
- **State Management**: Zustand for auth, local state for UI
- **CSS Architecture**: Component-scoped external CSS files
- **API Design**: RESTful with consistent patterns
- **Authentication**: JWT middleware on all protected routes