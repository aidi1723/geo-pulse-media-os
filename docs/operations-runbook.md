# Operations Runbook

## Local Startup

Install dependencies:

```bash
npm install
```

Reset the local demo state:

```bash
npm run reset:api-state
```

Start the local mock API:

```bash
npm run dev:api
```

In a second terminal, start the Vite app:

```bash
npm run dev
```

## Environment Variables

- `VITE_API_BASE_URL`: Frontend API base URL. Leave empty to preserve relative `/api` requests through the Vite proxy/local runtime.
- `GEO_PULSE_API_HOST`: Local API bind host. Defaults to `127.0.0.1`.
- `GEO_PULSE_API_PORT`: Local API port. Defaults to `8787`.
- `GEO_PULSE_STATE_FILE`: JSON state file used by the local mock API. Defaults to `server/data/state.json`.

## Health Checks

Check process health:

```bash
curl -sS http://127.0.0.1:8787/api/health
```

Expected meaning:

- The API process is running and can return service metadata.
- A healthy response means the local HTTP server is reachable.

Check local state readiness:

```bash
curl -sS http://127.0.0.1:8787/api/readiness
```

Expected meaning:

- The API can read its local JSON state store.
- This is a local mock API readiness check, not a production database readiness check.
- Because readiness currently calls `readState()`, it can create or seed the state file if it is missing.

## Reset Demo State

Run this before demos or after testing mutating workflows:

```bash
npm run reset:api-state
```

This restores `server/data/state.json` to the clean seed state and clears prior local approvals, notes, generated drafts, and task transitions.

## Request Logging

The local API logs each request on a best-effort basis:

- Method
- Path
- Status
- Duration

Query content and request bodies are not logged.

## Frontend Render Failures

The app has an app-level `ErrorBoundary` for render-time frontend failures. If the fallback appears:

- Check the browser console for the component/runtime error.
- Check the Vite terminal logs.
- Check the local API terminal logs if the failure followed an API request or state transition.

## Common Failures

### API Port Already In Use

Recovery:

1. Stop the existing process using port `8787`, or set `GEO_PULSE_API_PORT` to another port.
2. Restart `npm run dev:api`.
3. If the frontend uses a non-default API port, update `VITE_API_BASE_URL` accordingly.

### Frontend Cannot Reach API

Recovery:

1. Confirm the API terminal is still running.
2. Run `curl -sS http://127.0.0.1:8787/api/health`.
3. Confirm `VITE_API_BASE_URL` is empty for local proxy behavior, or points to the intended API base URL.
4. Restart `npm run dev` after changing environment variables.

### Readiness Creates a Missing State File

Recovery:

1. Treat this as expected local mock API behavior.
2. Run `npm run reset:api-state` if you need a known clean state.
3. Re-run `curl -sS http://127.0.0.1:8787/api/readiness`.

### Demo State Looks Stale

Recovery:

1. Stop the frontend and API only if they are actively mutating state.
2. Run `npm run reset:api-state`.
3. Restart `npm run dev:api` and `npm run dev`.

### Build or Test Fails After Pulling Changes

Recovery:

1. Run `npm ci`.
2. Run `npm test`.
3. Run `npm run build`.
4. Check `CHANGELOG.md` and `docs/maintenance-log.md` for recent architecture or workflow changes.
