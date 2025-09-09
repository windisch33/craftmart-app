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
