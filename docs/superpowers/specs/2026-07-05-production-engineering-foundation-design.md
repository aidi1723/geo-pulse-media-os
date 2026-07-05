# GEO-Pulse Production Engineering Foundation Design

Date: 2026-07-05

## Goal

Move GEO-Pulse from a public demo prototype toward a production-ready engineering baseline. This phase does not add real content ingestion, real AI generation, real publishing, login, or database persistence. It creates the verification, configuration, health, and release foundations required before those capabilities are added.

## Current Baseline

The project is a React + Vite frontend with a local Node mock API:

- Frontend entry: `src/main.jsx`, `src/App.jsx`
- Workspace state: `src/state/workspaceState.js`, `src/hooks/useWorkspaceController.js`
- Workflow actions: `src/actions/workflowActions.js`
- API request layer: `src/services/orchestrator.js`
- Local API: `server/mock-api.mjs`, `server/router.mjs`, `server/domain.mjs`, `server/state-store.mjs`
- Tests: `tests/server/`, `tests/src/`, `tests/ui/`
- Public repository: `https://github.com/aidi1723/geo-pulse-media-os`

Recent verification:

- `npm test`: 43 tests passing
- `npm run build`: Vite production build passing

## Non-Goals

This phase will not:

- Replace `server/data/state.json` with PostgreSQL.
- Add authentication, RBAC, user accounts, or session storage.
- Connect real AI model APIs.
- Connect real social platform publishing.
- Add background workers, queues, or Redis.
- Deploy to a production hosting provider.

Those belong to later production phases after the baseline is reliable.

## Proposed Approach

Use a small, incremental production foundation that preserves the current app behavior:

1. Add CI so every push validates install, tests, and build.
2. Add environment configuration so frontend and local API behavior are not hardcoded.
3. Add production-friendly health and readiness checks.
4. Add client/server error boundaries and clearer failure messages where the app already has error paths.
5. Add release and operations documentation so future production work follows a repeatable path.

This is the recommended path because it creates guardrails without forcing premature infrastructure decisions.

## Architecture Changes

### 1. CI Workflow

Add:

- `.github/workflows/ci.yml`

Behavior:

- Run on push and pull request to `main`.
- Use Node 22.
- Run `npm ci`.
- Run `npm test`.
- Run `npm run build`.

Rationale:

- Vite 7 requires a modern Node runtime.
- The project already has deterministic `package-lock.json`.
- CI should not publish or deploy in this phase.

### 2. Environment Configuration

Add:

- `.env.example`
- `src/config/runtimeConfig.js`
- Optional server config expansion in `server/config.mjs`

Frontend configuration:

- `VITE_API_BASE_URL`

Default:

- Empty string, which preserves current relative `/api` behavior through Vite proxy.

Usage:

- `src/services/orchestrator.js` should build request URLs through `runtimeConfig.apiBaseUrl`.
- Existing calls such as `getBootstrapData()` keep their public function signatures.

Server configuration:

- Keep current defaults: host `127.0.0.1`, port `8787`, state file `server/data/state.json`.
- Allow overrides through environment variables:
  - `GEO_PULSE_API_HOST`
  - `GEO_PULSE_API_PORT`
  - `GEO_PULSE_STATE_FILE`

Rationale:

- Enables local, preview, and future hosted environments without changing source code.

### 3. Health and Readiness Checks

Current endpoint:

- `GET /api/health`

Keep it and make the payload more useful:

```json
{
  "status": "ok",
  "service": "geo-pulse-api",
  "version": "0.1.0",
  "state": "ready",
  "date": "ISO timestamp"
}
```

Add or document:

- Health means the HTTP server is responding.
- Readiness means state storage can be read and parsed.

Implementation can either:

- Expand `/api/health` to include readiness, or
- Add `GET /api/readiness`.

Recommended for this phase:

- Add `GET /api/readiness` so health and state readiness remain separate.

### 4. Error Handling and Observability

Frontend:

- Keep existing app error banner.
- Add a small app-level error boundary component for render-time crashes.
- Keep request errors flowing through `extractErrorMessage`.

Server:

- Keep structured JSON errors through `sendError`.
- Add concise request logging for method, path, status, and duration.
- Do not log request bodies or private content by default.

Rationale:

- Production work needs diagnosable failures without leaking content or credentials.

### 5. Release and Operations Documentation

Add:

- `docs/operations-runbook.md`
- `docs/release-checklist.md`

Runbook should include:

- Local startup
- Resetting demo state
- Environment variables
- Health/readiness checks
- Common failures
- Recovery steps

Release checklist should include:

- `git status --short --branch`
- `npm ci`
- `npm test`
- `npm run build`
- Review `CHANGELOG.md`
- Confirm no ignored generated artifacts are required
- Push branch or merge PR

Update:

- `README.md`
- `docs/maintenance-log.md`
- `CHANGELOG.md`

## Data Flow

Frontend request flow:

```text
UI section -> workflow/action or service function -> orchestrator request -> runtimeConfig.apiBaseUrl + /api path -> local API
```

Server flow:

```text
request -> router -> domain/state-store -> JSON response or JSON error
```

CI flow:

```text
push/PR -> checkout -> setup Node 22 -> npm ci -> npm test -> npm run build
```

## Testing Strategy

Add or update tests for:

- Runtime config default API base URL.
- Runtime config URL joining behavior.
- `orchestrator` request path generation with base URL.
- Server config environment overrides.
- Readiness endpoint success.
- Readiness endpoint failure when state file is invalid or unreadable, using an isolated test store where feasible.
- Error boundary render fallback.

Existing tests must continue passing:

- `npm test`
- `npm run build`

## Rollback Strategy

All changes are local source and documentation changes. Rollback is standard git rollback:

```bash
git revert <commit>
```

No irreversible external state is introduced in this phase. CI creation affects GitHub workflow runs only and does not deploy artifacts.

## Success Criteria

This phase is complete when:

- GitHub Actions CI exists and runs tests/build on push and pull request.
- API base URL can be configured through `.env`.
- Server host, port, and state file can be configured through environment variables.
- Health and readiness checks are documented and tested.
- App has a render-time error boundary.
- Operations and release docs exist.
- `npm test` passes locally.
- `npm run build` passes locally.
- Changes are committed and pushed to `main`.

## Open Questions

No product-scope decisions are required for this phase. Later phases must decide:

- Which database to use first.
- Which authentication provider to use.
- Which real topic sources to ingest.
- Which AI generation API to integrate.
- Which publishing channels are allowed for automation.
