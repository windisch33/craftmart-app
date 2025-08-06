# CraftMart Development Commands

## Docker Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres

# Restart services
docker-compose restart frontend
docker-compose restart backend

# Stop all services
docker-compose down

# Clean rebuild
docker-compose down -v
docker-compose up -d --build
```

## Database Operations
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U craftmart_user -d craftmart

# Apply migrations
docker-compose exec -T postgres psql -U craftmart_user -d craftmart < database/migrations/[migration-file].sql

# Backup database
docker-compose exec postgres pg_dump -U craftmart_user craftmart > backup.sql
```

## Local Development (without Docker)
```bash
# Backend
cd backend
npm install
npm run dev        # Development with hot reload
npm run build      # Production build
npm run start      # Start production server

# Frontend
cd frontend
npm install
npm run dev        # Development server
npm run build      # Production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Git Commands
```bash
# Common workflow
git status
git add .
git commit -m "Description of changes"
git push origin main

# Feature branch workflow
git checkout -b feature/new-feature
git add .
git commit -m "feat: description"
git push origin feature/new-feature
```

## TypeScript Checking
```bash
# Backend TypeScript check
cd backend && npx tsc --noEmit

# Frontend TypeScript check
cd frontend && npx tsc --noEmit --skipLibCheck
```

## System Utilities (Linux)
```bash
# File operations
ls -la             # List all files with details
cd                 # Change directory
pwd                # Print working directory
cp -r              # Copy recursively
rm -rf             # Remove recursively (careful!)

# Process management
ps aux | grep node # Find node processes
kill -9 [PID]      # Force kill process
lsof -i :3000      # Check what's using port 3000

# Text search
grep -r "pattern" . # Search recursively
find . -name "*.ts" # Find TypeScript files
```