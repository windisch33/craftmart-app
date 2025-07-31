# CraftMart Task Completion Checklist

When completing any development task, follow these steps:

## Frontend Tasks
1. **Type Check**: Run `npx tsc --noEmit --skipLibCheck` in frontend directory
2. **Lint Check**: Run `npm run lint` in frontend directory
3. **Build Verification**: Run `npm run build` to ensure production build works
4. **Mobile Testing**: Verify responsiveness at 768px and 480px breakpoints
5. **Browser Testing**: Test in Chrome, Firefox, Safari (if available)

## Backend Tasks
1. **Type Check**: Run `npx tsc --noEmit` in backend directory
2. **Test Suite**: Run `npm test` if tests exist for the modified code
3. **Build Verification**: Run `npm run build` to ensure production build works
4. **API Testing**: Test endpoints with proper JWT authentication
5. **Error Handling**: Verify proper error responses and status codes

## Database Tasks
1. **Migration Scripts**: Create migration files in database/migrations/
2. **Backup First**: Always backup before applying migrations
3. **Test Rollback**: Ensure migrations can be rolled back if needed
4. **Index Performance**: Consider adding indexes for new query patterns

## General Tasks
1. **Git Status**: Check `git status` to review all changes
2. **Documentation**: Update CLAUDE.md if architecture changes
3. **Environment Variables**: Update .env.example if new vars added
4. **Security Review**: Ensure no secrets committed, proper validation
5. **Console Cleanup**: Remove any console.log statements

## Important Notes
- **NEVER** commit directly to main branch
- **ALWAYS** test with Docker environment matching production
- **VERIFY** mobile responsiveness for all UI changes
- **ENSURE** JWT authentication for all protected routes
- **UPDATE** documentation for significant changes

## Recommended Testing Flow
1. Make changes in development
2. Test locally with `npm run dev`
3. Build and test with Docker
4. Verify all checklist items
5. Commit with descriptive message
6. Create pull request for review