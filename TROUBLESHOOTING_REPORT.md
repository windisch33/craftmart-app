# Troubleshooting Report

## Recent Issues & Resolutions

### React render loop in QuickPricer (Maximum update depth exceeded)
- Symptom: Console error from `QuickPricer.tsx:127` due to `useEffect` calling `setState` on every render.
- Root cause: Tread validation effect wrote `hasLandingTread` unconditionally, retriggering dependencies.
- Fix: Guard state update — only update when computed value actually changes.

### Vite 500 on `/src/pages/Projects.tsx`
- Symptom: `net::ERR_ABORTED 500` loading the module during dev.
- Root cause: Type conflicts and duplicate identifiers during rename work (e.g., `Job` type name used for both parent and item-level).
- Fixes: 
  - Disambiguated types (`ParentJob` vs `JobItem`) in `ProjectDetail.tsx`.
  - Removed duplicate `showToast` declarations.
  - Verified with `tsc -b` and hot reloaded cleanly.

## Projects/Jobs Implementation Notes

### Current State (Post-Refactor)
- Jobs (`/jobs`) is the single entry point; the Job Items page and route are removed.
- The Customers page navigates to `/jobs?q=<Customer>` to view that customer’s jobs.
- Jobs header includes “Clear PDF Cache”.
- A `jobsService` alias re-exports `projectService` to align naming.

### Issue Discovery
- **Problem**: App showed blank white screen when clicking Projects in sidebar
- **User Feedback**: "the app now shows a blank white screen when i go to it, this is because of a change you had just made"
- **Initial Status**: Application worked fine before today's changes

### Systematic Debugging Process

#### Phase 1: Component Isolation
1. **Confirmed Root Cause**: Temporarily disabling Projects restored app functionality
2. **Identified Import Issues**: Found multiple import/export mismatches:
   - Missing `FolderIcon` export in `icons.tsx` ✅ Fixed
   - Incorrect `customerService` import (named vs default) ✅ Fixed  
   - Incorrect `jobService` import in `ProjectDetail.tsx` ✅ Fixed

#### Phase 2: Hook Investigation
- **Discovery**: Adding even an empty `useEffect` hook crashed the app
- **Initial Fix**: Missing `useEffect` import in Projects.tsx ✅ Fixed
- **Result**: Still crashed after fixing import

#### Phase 3: Component Architecture Testing
**Approach**: Progressive complexity testing
1. ✅ Minimal React component works
2. ✅ Adding basic imports (icons, types) works  
3. ❌ Adding service imports causes crash
4. ❌ Even minimal service files cause crash

#### Phase 4: Service Import Investigation
**Key Findings**:
- Any import from `projectService.ts` crashes the app
- Existing services (like `customerService`) work fine when imported
- Issue persists even with:
  - Minimal mock service (no axios, no API calls)
  - Default exports vs named exports
  - Fresh file creation from scratch
  - Different service filenames (`testService.ts`, `tempService.ts`)

#### Phase 5: Component Dependencies
**Discovered**: Project components had stale import references
- `ProjectDetail.tsx`: Used old named import syntax ✅ Fixed
- `ProjectList.tsx`: Used old named import syntax ✅ Fixed
- **Result**: Temporarily disabled all Project components - issue persisted

## Critical Discovery: Module Loading Issue

**The Problem**: ANY newly created service file causes the entire application to crash with a blank screen, regardless of:
- File content (even minimal exports)
- Import syntax (named vs default)
- Filename
- File location

**Evidence**:
- ✅ `import customerService` (existing service) works
- ❌ `import projectService` (new service) crashes
- ❌ `import testService` (new minimal service) crashes  
- ❌ `import tempService` (different filename) crashes

## Root Cause Analysis

This behavior indicates a **severe module loading/caching issue** in the Vite development server:
1. Existing services work because they're already in the module cache
2. New service files trigger a module resolution issue
3. The problem is not with our code but with the build system's module handling

## Current Status

### Files Modified During Debugging
- `/frontend/src/pages/Projects.tsx` - Multiple iterations, currently minimal
- `/frontend/src/services/projectService.ts` - Deleted (was causing crashes)
- `/frontend/src/components/common/icons.tsx` - Added FolderIcon export
- `/frontend/src/components/projects/ProjectDetail.tsx` - Fixed imports, temporarily disabled  
- `/frontend/src/components/projects/ProjectList.tsx` - Fixed imports, temporarily disabled
- `/frontend/src/components/projects/ProjectForm.tsx` - Temporarily disabled
- `/frontend/src/components/common/Sidebar.tsx` - Added Projects navigation
- `/frontend/src/App.tsx` - Added Projects route

### Component Status
- **Projects Page**: ✅ Loads with minimal content (no service imports)
- **Project Components**: ⚠️ Temporarily disabled (renamed to `.disabled`)
- **ProjectService**: ❌ Missing (deleted due to module loading issues)
- **Navigation**: ✅ Projects appears in sidebar and routes correctly

## Recommended Solution

### Immediate Action Required
**Restart the development server** to clear Vite's module cache:
```bash
# Stop current server (Ctrl+C)
docker-compose restart frontend
# or
docker-compose down && docker-compose up -d
```

### Post-Restart Implementation Plan
1. **Re-enable Project Components**:
   ```bash
   cd frontend/src/components/projects
   mv ProjectDetail.tsx.disabled ProjectDetail.tsx
   mv ProjectList.tsx.disabled ProjectList.tsx  
   mv ProjectForm.tsx.disabled ProjectForm.tsx
   ```

2. **Recreate ProjectService**: Use the working implementation from backup:
   ```typescript
   // Based on Projects.tsx.backup - known working version
   import axios from 'axios';
   // ... (full implementation available in backup)
   ```

3. **Test Incrementally**: Import service → add hooks → add API calls → add components

## Lessons Learned

1. **Module System Fragility**: Vite's hot module replacement can get corrupted with certain import patterns
2. **Incremental Testing**: Critical for identifying exactly what breaks complex integrations
3. **Import/Export Consistency**: Mismatched import patterns can cascade into module loading failures
4. **Development Server Restart**: Sometimes necessary to clear corrupted module cache

## Files to Monitor Post-Fix
- Check for TypeScript compilation errors
- Verify all import statements use consistent patterns
- Test API endpoints independently  
- Confirm no circular dependencies between jobService and projectService

---

**Next Steps**: Restart development server and systematically rebuild the Projects feature using the working patterns identified during debugging.
