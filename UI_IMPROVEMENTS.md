"""
# UI Improvements Roadmap

This document proposes consistent, project‑wide UI/UX enhancements. Items are grouped for quick triage and parallelization. Each bullet is small, actionable, and applicable across views (Dashboard, Customers, Jobs, Projects, Shops, Reports).

## High‑Impact
- Project context: Show project name everywhere it applies (Jobs grid/cards, Job Detail header, PDF preview header). Add breadcrumb (e.g., `Projects > Kitchen Remodel > Job #0123`).
- PDF preview UX: Add “Open in new tab” adjacent to “Download”. Surface header context (Project • Job • Status). Show retry with error reason and a Re‑authenticate CTA on 401.
- Toast notifications: Replace `alert()`/inline errors with toasts for create/update/delete, PDF generation, and cache clears (non‑blocking, auto‑dismiss). Example lib: `react-hot-toast`.

## Navigation & Layout
- Saved filters: Persist Jobs/Projects filters in URL query params (`?q=…&status=…`) and restore on load.
- Sticky controls: Keep search + bulk actions sticky when scrolling long lists (Jobs/Projects/Shops).
- Consistent empty states: Unify style and CTAs (e.g., “Create Project”, “Create Job”) with 1–2 lines of guidance.

## Forms & Validation
- Inline validation: Field‑level errors on blur and submit; disable submit during requests; show “Saving…” state.
- Lookup UX: Searchable dropdowns for Customers/Salesmen in JobForm (type‑ahead with debounce, loading state).
- Error display: Consolidated error banner at form top; scroll to first errored field.

## Performance
- Virtualized lists: Virtualize Jobs/Projects grids for large datasets (e.g., `react-window`).
- Code‑splitting: Lazy‑load heavy modules (QuickPricer, PDF preview); show skeletons/placeholders.
- Image/PDF optimizations: Stream PDFs (range requests if feasible); compress large images.

## Accessibility (A11y)
- Modal focus: Trap focus, restore focus on close, add `aria-labelledby`/`aria-describedby`.
- Keyboard support: Esc closes modals; Enter confirms safe actions; Tab order predictable.
- Icon‑only buttons: Add `aria-label`/`title` (Edit, Delete, Next Stage, PDF actions).

## Visual Consistency
- Status badges: Standardize colors and text across Jobs grid, Job Detail, and PDF preview.
- Date/currency: Centralize formatting (one util) for `MM/DD/YYYY`, localized currency, and relative times.
- Density & spacing: Adopt consistent spacing scale (e.g., 4/8/12/16 px) and line‑heights.

## Quality of Life
- Cross‑links: From Job Detail → View Project; from Project Detail → Create Job (prefill project).
- “Last updated” meta: Show updated timestamps on list cards and detail headers.
- PDF cache feedback: After clear, show toast and auto‑refresh preview.

## Rollout & Tracking
- Phased rollout: Start with Jobs/Projects (highest traffic), then extend.
- Feature flags (optional): Gate larger changes (virtualization, lazy‑loads) for safe rollout.
- Metrics: Track time‑to‑interactive for heavy views and toast interaction rates.

## Code Touchpoints (examples)
- Breadcrumbs/headers: `frontend/src/components/**/Header`, `frontend/src/pages/**`
- Toasts: `frontend/src/components/common/*` (add provider at `App.tsx`)
- PDF preview: `frontend/src/components/jobs/JobPDFPreview.tsx`
- Date/number utils: `frontend/src/utils/*`

> Tip: Keep changes incremental and ship behind small PRs (1–3 bullets each) for quicker review.
"""

Progress (implemented)
- Accessibility: Added `AccessibleModal` with focus trap, Escape/backdrop close, and ARIA; refactored core modals (Jobs, Projects, Users, Customers, Stairs, PDF, confirmations).
- Feedback: Introduced ToastProvider and wired success/error toasts in key flows.
- Filters & Nav: Persisted filters in URL (Jobs/Projects); added sticky search/controls.
- Empty states: Unified style and CTAs across Customers, Salesmen, Users, Projects, Shops.
- Visual refresh: Improved modal overlay depth, content shadows, sticky header/footer chrome, consistent close buttons, and focus rings.
- Theming: Centralized primary color in `variables.css`; migrated widespread hard-coded blues to variables; added Quick Pricer theming.
- Docs: Added THEME_MIGRATION.md and linked presets; updated AGENTS.md with modal/theming guidance.
