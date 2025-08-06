# CraftMart Task Completion Checklist

## When Completing a Task

### 1. Code Quality Checks
```bash
# Frontend TypeScript compilation
cd frontend && npx tsc --noEmit --skipLibCheck

# Backend TypeScript compilation  
cd backend && npx tsc --noEmit

# Frontend linting
cd frontend && npm run lint
```

### 2. Testing
- Manual testing of new features
- Check for console errors in browser
- Test on mobile viewport (responsive design)
- Verify JWT authentication still works

### 3. Database Considerations
- If schema changed, create migration file in `database/migrations/`
- Test migration on fresh database
- Update `database/init/01-init.sql` if needed

### 4. Documentation Updates
- Update CLAUDE.md if significant features added
- Update README.md for new setup steps
- Add JSDoc comments for complex functions
- Update API endpoint documentation

### 5. Before Committing
- Remove any console.log statements
- Check for hardcoded values that should be env variables
- Ensure no sensitive data in code
- Verify all files are properly formatted
- Run `git status` to review changes

### 6. Git Commit Best Practices
```bash
# Use conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue with X"
git commit -m "refactor: improve Y structure"
git commit -m "docs: update documentation"
```

### 7. Important Reminders
- NEVER commit .env files
- NEVER add comments unless specifically requested
- ALWAYS follow existing code patterns
- ALWAYS maintain 44px touch targets for mobile
- ALWAYS use parameterized queries for database operations