# Changelog

## 2026-07-05

### Added

- Added GitHub Actions CI for push and pull request checks on `main` with Node 22, `npm ci`, `npm test`, and `npm run build`.
- Added `.env.example` documenting frontend and local API runtime configuration.
- Added `GET /api/readiness` alongside enriched `/api/health` metadata for local operational checks.
- Added local API request logging for method, path, status, and duration without query content or request bodies.
- Added an app-level `ErrorBoundary` fallback for render-time frontend failures.
- Added `docs/operations-runbook.md` and `docs/release-checklist.md` for local operations, health/readiness checks, and release verification.
- Added `docs/maintenance-guide.md` with maintenance paths, content update checklist, test ownership, build artifact guidance, and GitHub release checklist.
- Added `docs/project-closeout.md` with project status, delivery contents, verification record, GitHub status, and next priorities.
- Added `docs/maintenance-log.md` with path ownership, recent update records, next maintenance tasks, and risk notes.
- Added `src/state/workspaceState.js` to centralize workspace defaults and bootstrap payload mapping.
- Added `src/hooks/useWorkspaceController.js` to own workspace state and focused workspace mutators.
- Added `src/actions/workflowActions.js` to isolate generate, workflow, topic refresh, and distribution scheduling actions.
- Added `src/actions/jobActions.js` for task note and review action behavior.
- Added `src/actions/artifactRouting.js` for task artifact-to-workspace routing.
- Added orchestrator contract coverage for request paths, methods, bodies, and error throwing.
- Added `server/job-state-machine.mjs` with dedicated tests for task approve, reject, retry, and cancel transitions.
- Added regression coverage for workspace state mapping, workspace controller behavior, workflow actions, and state-store isolation.

### Changed

- Updated GitHub Actions CI to `actions/checkout@v7.0.0` and `actions/setup-node@v6.4.0` while keeping the project runtime on Node 22.
- Updated runtime API configuration so the frontend can use `VITE_API_BASE_URL` and the local server can be overridden with `GEO_PULSE_API_HOST`, `GEO_PULSE_API_PORT`, and `GEO_PULSE_STATE_FILE`.
- Updated `README.md` with current module responsibilities, maintenance entry points, and verification commands.
- Updated `README.md` with CI, environment configuration, health/readiness endpoints, request logging, error boundary behavior, and operations documentation links.
- Updated `docs/system-architecture.md` with the current frontend state/action split, server responsibilities, job state machine boundary, and next refactor priorities.
- Updated `docs/project-closeout.md` and `docs/maintenance-guide.md` with the final maintenance paths, verification count, and remaining productionization priorities.
- Updated `docs/maintenance-guide.md` with the public GitHub repository location and branch tracking status.
- Moved Studio asset mode options from static mock imports to workspace payload-driven props.
- Refactored `App.jsx` so it focuses more on layout, bootstrap, task detail loading, and page composition.
- Refactored `App.jsx` to delegate job mutation and artifact routing behavior to focused action modules.
- Refactored `server/domain.mjs` to delegate task action transitions to the focused job state machine.
- Updated `server/state-store.mjs` with `createStateStore(stateFile)` for isolated tests while preserving default local API persistence.
- Updated the default `npm test` script to include all new maintenance and refactor regression tests.

### Verification

- `npm test` — 103 tests passing.
- `npm run build` — Vite production build completed.

## 2026-05-23

### Added

- Added `DESIGN.md` as the UI design source of truth for GEO-Pulse, covering color roles, typography, layout, component states, motion, and implementation constraints.
- Added UI regression tests for loading-state controls, task board busy states, and workflow focus fallback behavior.
- Added server router tests for API boundary errors, including unknown scenarios, blank notes, non-string notes, and non-string generation input.
- Added an inline favicon to remove browser console noise during demos.

### Changed

- Improved dashboard responsiveness across desktop, tablet, and mobile layouts.
- Added visible focus styles and consistent disabled states for buttons, selects, and textareas.
- Disabled global workflow controls while a workflow or scenario operation is pending to prevent duplicate submissions.
- Disabled section actions while refresh, generation, or distribution scheduling is in progress.
- Made task notes and job actions consistently lock while an action is running.
- Tightened mock API behavior so unknown `scenarioKey` values return 400 instead of silently falling back to the default scenario.
- Tightened mock API input validation so invalid note and generation payload types return 400 with clear messages.
- Documented API boundary behavior and the new design reference in `README.md`.

### Fixed

- Fixed a runtime error where `handleRunWorkflow` referenced `pickRelevantJobId` without importing it.
- Fixed JSX runtime issues in Node-based component tests by making React imports explicit across tested components.
- Fixed mobile layout overflow risks by improving wrapping, single-column breakpoints, and long-text handling.
- Fixed repeated-submit risks for primary workflow, refresh, generation, distribution, note, and review actions.

### Verification

- `npm test`
- `npm run build`
- Playwright browser check at `http://127.0.0.1:4173/`
- Desktop and 390px mobile viewport checks
- Mock API state reset with `npm run reset:api-state`
