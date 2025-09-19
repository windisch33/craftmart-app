# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: React + TypeScript app (Vite). Source in `src/`, assets in `public/`, build output in `dist/`.
- `backend/`: Node/Express + TypeScript API. Source in `src/`, compiled JS in `dist/`.
- `database/`: SQL migrations/seed data (if present).
- `nginx/`, `docker-compose.yml`: Local/container orchestration.
- Top-level docs: implementation plans, troubleshooting, and reports.

## Build, Test, and Development Commands
- Frontend (from `frontend/`):
  - `npm run dev`: Start Vite dev server.
  - `npm run build`: Type-check and build production assets.
  - `npm run preview`: Preview production build.
  - `npm run lint`: Lint TypeScript/React with ESLint.
- Backend (from `backend/`):
  - `npm run dev`: Start API with auto-reload (ts-node-dev).
  - `npm run build`: Compile TypeScript to `dist/`.
  - `npm start`: Run compiled server.
  - `npm test`: Run Jest tests (if present).
- Docker (repo root): `docker-compose up --build` to spin up the full stack.

## Coding Style & Naming Conventions
- TypeScript strict mode; prefer `import type` for type-only imports.
- ESLint enforced (frontend): React Hooks, Refresh, and TypeScript rules.
- Formatting: follow existing style; 2-space indentation; PascalCase components; camelCase vars/functions; kebab-case files (except React components).
- Avoid `any`; introduce narrow interfaces and mapping helpers as needed.

## Testing Guidelines
- Backend: Jest; place tests in `backend/src/**/__tests__` or `**/*.test.ts`.
- Frontend: Co-locate tests in `src/**/__tests__` where useful.
- Prefer deterministic tests with realistic fixtures; document edge cases.

## Commit & Pull Request Guidelines
- Commits: present tense, scoped messages (e.g., `frontend: fix PDF preview timeout`).
- PRs: include summary, linked issues, screenshots/logs for UI/bug fixes, and test notes.
- Keep PRs focused; update docs when commands/behavior change.

## Security & Configuration Tips
- Copy `.env.example` to `.env` (frontend and backend) and set secrets locally.
- Never commit secrets; use env vars and Docker secrets.
- Verify CORS, auth headers, and rate limits in `backend/` before exposing endpoints.

## PDF Changes: Rebuild & Cache
- Backend template lives in `backend/src/services/pdfService.ts`.
- After changing PDF HTML/SQL:
  - Rebuild/restart backend: `docker compose down && docker compose up --build -d`
  - Clear PDF cache: Jobs page “Clear PDF Cache” or API:
    - `DELETE /api/jobs/cache/pdf` (all) or `DELETE /api/jobs/:jobId/cache/pdf` (one).
- Verify filename and content reflect updates (project name appears in header and filename).

## Toasts (UI Feedback)
- Global provider: `ToastProvider` wraps the app in `frontend/src/App.tsx`.
- Use in components:
  - `import { useToast } from '../components/common/ToastProvider'`
  - `const { showToast } = useToast();`
  - `showToast('Saved successfully', { type: 'success' });`
- Types: `type?: 'success' | 'error' | 'info'`, `duration?: number` (ms). Click toast to dismiss.

## Accessible Modals
- Component: `frontend/src/components/common/AccessibleModal.tsx`
- Features: `role="dialog"`, `aria-modal="true"`, Escape-to-close, focus trap, backdrop close, focus restore.
- Usage:
  - Wrap modal content: `<AccessibleModal isOpen onClose labelledBy overlayClassName contentClassName>...`.
  - Provide a heading with matching `id` and pass as `labelledBy`.
  - Add `aria-label="Close dialog"` to close buttons.
- Refactored modals:
  - Job Detail, Project Detail, Project Form, Job Form, Job PDF Preview, Next Stage Confirm, Customer Jobs, Users Reset Password, Stair Configurator, Stair Special Parts Form, Stair Board Type Form, Stair Material Form.

## Theme Migration (Primary Color)
- Primary color lives in `frontend/src/styles/variables.css` (`--color-primary-*`, `--gradient-primary`).
- We migrated many pages/components to consume the theme tokens; see `THEME_MIGRATION.md` for progress and remaining files.
- To change theme globally: edit the primary ramp in `variables.css`, then hard refresh or rebuild.

## Shops (Cut Sheets)
- UI: `frontend/src/pages/Shops.tsx` (list, generate, status, download).
- API: `backend/src/routes/shops.ts` → controller/service in `backend/src/controllers/shopController.ts`, `backend/src/services/shopService.ts` and `backend/src/services/pdfService.ts`.
- Database:
  - Join table `shop_jobs` (migrations `database/migrations/20-*.sql`, `21-*.sql`).
  - Tracking on `job_items`: `shops_run`, `shops_run_date` (migration `22-add-shops-run-to-job-items.sql`).
- Generation rules (Shops.txt):
  - Eligible jobs: status `order`; select all / individual / only unrun.
  - Mark selected orders as `shops_run=true` on success; exclude invoiced.
- PDFs (generated with Puppeteer in Docker):
  - Shop Paper: quote‑like list of Rail parts and Stair configurations by job (no pricing); includes per‑job signature + warning block.
  - Cut List: grouped by Job → Location → Stair; item labels `TREADS`/`RISERS`/`S4S`; dimensions in fractional inches; minimal header (no “OAK LIST”).
- Dimension formulas:
  - Treads: width = configuration rough_cut + nose; length base = stair span. Box: −1.25", Open (open_left/right): −0.625", Double‑open: 0.
  - Risers: width = riser_height; length base = riser length. Box: −1.25", Open: −1.875", Double‑open: −2.5".
  - S4S: width = riser_height − 1"; length follows double‑open > open > box.
- Common tasks:
  - Generate: `POST /api/shops/generate { orderIds: number[] }`
  - List: `GET /api/shops`
  - PDFs: `GET /api/shops/:id/cut-list`, `GET /api/shops/:id/shop-paper`
  - Available orders: `GET /api/shops/available-orders?filter=unrun|all`
- Notes:
  - If login rate limiter blocks automated testing, wait or adjust `RATE_LIMIT_*` in `backend/.env`.
  - Fraction precision defaults to 1/32; adjust in `pdfService.ts` if required.
  - Material/grade wording can be mapped in `pdfService.ts` if business rules require legacy labels (e.g., “2nd Grade Oak”).
