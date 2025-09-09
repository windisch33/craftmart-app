# TypeScript Cleanup Tasks

This checklist tracks the follow-up items after fixing the Projects import issue and performing initial TS triage.

## Status
- TypeScript build: passes locally via `frontend/node_modules/.bin/tsc -b`
- Vite build: blocked by sandbox (EPERM) in this environment; verify locally.

## High Priority
- Verify Projects API endpoints exist and match `projectService`:
  - GET `/api/projects`, GET `/api/projects/:id`, POST `/api/projects`, PUT `/api/projects/:id`, DELETE `/api/projects/:id`.
  - If different, update `frontend/src/services/projectService.ts` accordingly.
- Enforce `import type` usage across codebase:
  - Add ESLint rule `@typescript-eslint/consistent-type-imports`.

## Stair Domain Alignment
- Normalize stair types to remove `any` bridges:
  - `StairConfiguration` (snake_case vs camelCase properties in UI vs API).
  - `StairSpecialPart` (ensure `quantity` is present where needed in UI-only flows).
  - Review mapping logic in `ProductSelector` save paths where both camel and snake keys are accepted.
- Replace temporary placeholders used for draft/sandbox mode:
  - `QuickPricer` temporary `StairSpecialPart` (`id`, `is_active`) when adding parts client-side.
  - Ensure backend accepts/ignores client-only fields as expected, or introduce explicit client models.

## Code Hygiene
- Remove remaining `as any` casts once types are aligned.
- Validate “next status” transitions are limited to `quote -> order -> invoice`.
- Audit for unused variables in Salesmen/Users pages after recent cleanups.

## Verification
- Run `npm run dev` in `frontend` locally, navigate and verify:
  - Projects page list, create, edit, delete flows.
  - Jobs list: search, filters, next stage confirmations.
  - Stair quick pricer: calculate, add special parts, save configuration.
  - PDF preview and download.

## Optional Improvements
- Add lightweight unit tests for utils in `frontend/src/utils/jobCalculations.ts`.
- Introduce a stricter shared API client type layer to map backend DTOs to UI models.
