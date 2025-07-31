# CraftMart Development Commands

## Docker Commands (Primary Development Method)
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres

# Restart specific service
docker-compose restart frontend
docker-compose restart backend

# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Local Development Commands
```bash
# Backend development
cd backend
npm install
npm run dev        # Starts on port 3001
npm run build      # Production build
npm test           # Run tests

# Frontend development
cd frontend
npm install
npm run dev        # Starts on port 3000
npm run build      # Production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Database Commands
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U craftmart_user -d craftmart

# Apply migrations
docker-compose exec -T postgres psql -U craftmart_user -d craftmart < database/migrations/02-enhance-jobs-table.sql

# Backup database
docker-compose exec postgres pg_dump -U craftmart_user craftmart > backup.sql

# Restore database
docker-compose exec -T postgres psql -U craftmart_user -d craftmart < backup.sql
```

## Git Commands
```bash
# Clone repository
git clone git@github.com:windisch33/craftmart-app.git

# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "Description of changes"

# Push to remote
git push origin feature/new-feature

# Check current branch status
git status
```

## TypeScript Commands
```bash
# Check TypeScript compilation (frontend)
cd frontend
npx tsc --noEmit --skipLibCheck

# Check TypeScript compilation (backend)
cd backend
npx tsc --noEmit
```

## Access URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432
- Production: https://www.cmioe.com

## Test Credentials
- Admin: admin@craftmart.com / password123
- User: john.doe@craftmart.com / password123
- User: jane.smith@craftmart.com / password123