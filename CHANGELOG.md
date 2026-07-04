# Changelog

## 2026-07-05

### Added

- Added `docs/maintenance-guide.md` with maintenance paths, content update checklist, test ownership, build artifact guidance, and GitHub release checklist.
- Added `src/state/workspaceState.js` to centralize workspace defaults and bootstrap payload mapping.
- Added `src/hooks/useWorkspaceController.js` to own workspace state and focused workspace mutators.
- Added `src/actions/workflowActions.js` to isolate generate, workflow, topic refresh, and distribution scheduling actions.
- Added regression coverage for workspace state mapping, workspace controller behavior, workflow actions, and state-store isolation.

### Changed

- Updated `README.md` with current module responsibilities, maintenance entry points, and verification commands.
- Updated `docs/system-architecture.md` with the current frontend state/action split, server responsibilities, and next refactor boundaries.
- Moved Studio asset mode options from static mock imports to workspace payload-driven props.
- Refactored `App.jsx` so it focuses more on layout, bootstrap, task detail loading, and artifact routing.
- Updated `server/state-store.mjs` with `createStateStore(stateFile)` for isolated tests while preserving default local API persistence.
- Updated the default `npm test` script to include all new maintenance and refactor regression tests.

### Verification

- `npm test` — 43 tests passing.
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
