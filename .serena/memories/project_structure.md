# CraftMart Project Structure

## Root Directory
```
craftmart-app/
├── backend/                 # Node.js/Express API
├── frontend/               # React application
├── database/               # PostgreSQL initialization
├── nginx/                  # Reverse proxy configuration
├── cloudflared/            # Cloudflare Tunnel configuration
├── docker-compose.yml      # Development environment
├── .env.example           # Environment template
├── .gitignore             # Git exclusions
├── CLAUDE.md              # AI assistant guide
├── README.md              # Project documentation
├── outline.txt            # Original requirements
└── Logo.png               # Company logo
```

## Backend Structure
```
backend/
├── src/
│   ├── app.ts             # Express app configuration
│   ├── server.ts          # Server entry point
│   ├── controllers/       # Request handlers
│   │   ├── authController.ts
│   │   ├── customerController.ts
│   │   ├── jobController.ts
│   │   ├── productController.ts
│   │   ├── salesmanController.ts
│   │   └── ...
│   ├── routes/            # API route definitions
│   ├── middleware/        # Auth, error handling
│   ├── services/          # Business logic
│   ├── config/            # Database configuration
│   └── utils/             # Helper functions
├── uploads/               # File storage
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── Dockerfile            # Container definition
```

## Frontend Structure
```
frontend/
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Root component
│   ├── components/       # UI components
│   │   ├── common/       # Shared components
│   │   │   ├── Header.tsx/css
│   │   │   ├── Sidebar.tsx/css
│   │   │   └── SelectableList.tsx/css
│   │   ├── customers/    # Customer components
│   │   ├── jobs/         # Job components
│   │   ├── products/     # Product components
│   │   └── salesmen/     # Salesman components
│   ├── pages/            # Route pages
│   ├── services/         # API integration
│   ├── hooks/            # Custom React hooks
│   ├── styles/           # Global styles
│   └── utils/            # Helper functions
├── public/               # Static assets
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript config
```

## Database Structure
```
database/
├── init/
│   └── 01-init.sql      # Initial schema + sample data
└── migrations/          # Schema updates
    ├── 02-enhance-jobs-table.sql
    ├── 04-add-customer-last-visited.sql
    ├── 05-add-landing-tread-product-type.sql
    └── 06-add-rail-parts-product-type.sql
```

## Key Component Patterns
- **Controllers**: Export individual async functions
- **Routes**: Group related endpoints, use middleware
- **Components**: Function components with external CSS
- **Services**: Axios instances with auth interceptors
- **Pages**: Route-level components that compose smaller components