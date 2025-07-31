# System Utilities for CraftMart Development

## Linux System Commands
```bash
# File and Directory Operations
ls -la              # List all files with details
cd /path/to/dir     # Change directory
pwd                 # Print working directory
mkdir -p dir        # Create directory with parents
rm -rf dir          # Remove directory recursively
cp -r src dest      # Copy directory recursively
mv old new          # Move/rename files

# File Viewing and Editing
cat file            # Display file contents
less file           # Page through file
head -n 20 file     # Show first 20 lines
tail -n 20 file     # Show last 20 lines
tail -f file        # Follow file updates

# Searching
grep -r "pattern" . # Search recursively
find . -name "*.ts" # Find files by name
which command       # Find command location

# Process Management
ps aux              # List all processes
kill -9 PID         # Force kill process
lsof -i :3000       # Find process on port

# Network
curl http://localhost:3001/api/health
wget https://example.com/file
ping localhost
netstat -tuln       # List listening ports

# Permissions
chmod +x script.sh  # Make executable
chown user:group file
```

## Docker Utilities
```bash
# Container Management
docker ps           # List running containers
docker ps -a        # List all containers
docker logs container_name
docker exec -it container_name bash
docker stop container_name
docker rm container_name

# Image Management
docker images       # List images
docker build -t name .
docker rmi image_id

# Docker Compose
docker-compose ps   # List services
docker-compose logs -f service_name
docker-compose exec service_name bash
```

## Git Utilities
```bash
# Status and History
git status
git log --oneline -10
git diff
git diff --staged

# Branches
git branch -a       # List all branches
git checkout branch_name
git checkout -b new_branch
git merge branch_name

# Remote Operations
git fetch
git pull
git push origin branch_name
git remote -v

# Stashing
git stash
git stash list
git stash pop

# Undoing Changes
git reset HEAD~1    # Undo last commit
git checkout -- file # Discard changes
```

## Node.js/npm Utilities
```bash
# Package Management
npm list            # List installed packages
npm outdated        # Check for updates
npm update
npm audit           # Security check
npm audit fix

# Running Scripts
npm run             # List available scripts
npm run dev
npm run build
npm test

# Debugging
node --inspect server.js
npm ls package_name # Check package version
```

## PostgreSQL Utilities
```bash
# psql Commands (inside container)
\l                  # List databases
\c database_name    # Connect to database
\dt                 # List tables
\d table_name       # Describe table
\q                  # Quit psql

# SQL Utilities
SELECT * FROM table LIMIT 10;
EXPLAIN ANALYZE query;  # Query performance
\timing on          # Show query timing
```

## Environment Variables
```bash
# View environment
env                 # List all variables
echo $VARIABLE      # Show specific variable
export VAR=value    # Set variable

# Docker environment
docker-compose exec service_name env
```