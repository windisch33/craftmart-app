# CraftMart Tech Stack

## Backend
- **Runtime**: Node.js 20 (Alpine Linux in Docker)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 15
- **Authentication**: JWT with bcryptjs
- **PDF Generation**: Puppeteer
- **Validation**: Joi
- **Security**: Helmet, CORS
- **File Upload**: Multer
- **Development**: ts-node-dev for hot reload

## Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Styling**: External CSS modules (no CSS frameworks)
- **Linting**: ESLint with TypeScript config

## Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx (Alpine)
- **Production Access**: Cloudflare Tunnel
- **Version Control**: Git/GitHub

## TypeScript Configuration
- **Backend**: Strict mode enabled, CommonJS modules, ES2020 target
- **Frontend**: ES modules, composite project with app/node configs
- **All strict checks enabled**: noImplicitAny, strictNullChecks, etc.