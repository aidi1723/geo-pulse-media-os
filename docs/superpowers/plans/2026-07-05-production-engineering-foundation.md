# Production Engineering Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production engineering baseline for GEO-Pulse: CI, runtime configuration, health/readiness checks, request logging, error boundary coverage, and operations documentation.

**Architecture:** Preserve the current React + Vite frontend and local Node mock API while adding configuration and verification boundaries around them. Frontend requests flow through a small runtime config module, server defaults remain local-first but can be overridden by environment variables, and operational checks are exposed through dedicated health/readiness endpoints.

**Tech Stack:** React 19, Vite 7, Node 22, `node:test`, JSDOM, GitHub Actions, plain Node HTTP server.

---

## File Structure

- Create `.github/workflows/ci.yml`: GitHub Actions workflow for install, tests, and production build.
- Create `.env.example`: documented local environment variables for frontend and API server.
- Create `src/config/runtimeConfig.js`: frontend API base URL normalization and URL joining.
- Modify `src/services/orchestrator.js`: route all API calls through `buildApiUrl()` while keeping public service signatures unchanged.
- Create `tests/src/runtime-config.test.mjs`: unit coverage for default base URL and URL joining.
- Create `tests/src/orchestrator.test.mjs`: service-layer coverage proving requests use configured API base URLs.
- Modify `server/config.mjs`: parse `GEO_PULSE_API_HOST`, `GEO_PULSE_API_PORT`, and `GEO_PULSE_STATE_FILE` with current defaults.
- Create `tests/server/config.test.mjs`: isolated import tests for server environment overrides and invalid port fallback.
- Modify `server/state-store.mjs`: expose a `checkReadiness()` helper from each state store.
- Modify `server/router.mjs`: enrich `/api/health`, add `/api/readiness`, and optionally inject a store for tests without changing production entrypoints.
- Modify `tests/server/router.test.mjs`: cover health payload, readiness success, and readiness failure.
- Modify `server/http.mjs`: track response status and add a request logger wrapper without logging bodies.
- Modify `server/mock-api.mjs`: wrap `handleRequest` with the request logger.
- Create `src/components/ErrorBoundary.jsx`: app-level render-time fallback.
- Modify `src/main.jsx`: wrap `<App />` in `<ErrorBoundary>`.
- Create `tests/ui/error-boundary.test.jsx`: JSDOM coverage for fallback rendering.
- Modify `package.json`: include new test files in `npm test`.
- Create `docs/operations-runbook.md`: local startup, reset, environment variables, checks, common failures, and recovery.
- Create `docs/release-checklist.md`: repeatable release verification checklist.
- Modify `README.md`: document CI, env config, readiness, and operations docs.
- Modify `CHANGELOG.md`: record production foundation work.
- Modify `docs/maintenance-log.md`: append production foundation maintenance entry and paths.

## Task 1: Add CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the GitHub Actions workflow**

Create `.github/workflows/ci.yml` with exactly:

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  verify:
    name: Test and build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build production bundle
        run: npm run build
```

- [ ] **Step 2: Validate workflow syntax by inspection**

Run:

```bash
sed -n '1,120p' .github/workflows/ci.yml
```

Expected: output shows `name: CI`, `node-version: 22`, `npm ci`, `npm test`, and `npm run build`.

- [ ] **Step 3: Commit**

Run:

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add production verification workflow"
```

Expected: commit succeeds.

## Task 2: Add Frontend Runtime API Configuration

**Files:**
- Create: `src/config/runtimeConfig.js`
- Create: `tests/src/runtime-config.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing runtime config tests**

Create `tests/src/runtime-config.test.mjs` with exactly:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildApiUrl,
  createRuntimeConfig,
  normalizeApiBaseUrl,
} from "../../src/config/runtimeConfig.js";

test("runtime config defaults to relative API requests", () => {
  const config = createRuntimeConfig({});

  assert.deepEqual(config, {
    apiBaseUrl: "",
  });
  assert.equal(buildApiUrl("/api/health", config), "/api/health");
});

test("runtime config trims trailing slashes from API base URL", () => {
  assert.equal(normalizeApiBaseUrl("https://api.example.com///"), "https://api.example.com");
});

test("buildApiUrl joins configured base URL with an API path", () => {
  const config = createRuntimeConfig({
    VITE_API_BASE_URL: "https://api.example.com/",
  });

  assert.equal(buildApiUrl("/api/bootstrap?scenario=consumer-tech", config), "https://api.example.com/api/bootstrap?scenario=consumer-tech");
});

test("buildApiUrl accepts paths without a leading slash", () => {
  const config = createRuntimeConfig({
    VITE_API_BASE_URL: "https://api.example.com",
  });

  assert.equal(buildApiUrl("api/jobs", config), "https://api.example.com/api/jobs");
});
```

- [ ] **Step 2: Add the new test file to `npm test`**

In `package.json`, update the `test` script so the first `node --test` command includes `tests/src/runtime-config.test.mjs` after the server tests and before the existing source tests:

```json
"test": "node --test tests/server/domain.test.mjs tests/server/errors.test.mjs tests/server/router.test.mjs tests/server/state-store.test.mjs tests/src/runtime-config.test.mjs tests/src/generation-utils.test.mjs tests/src/workflow-actions.test.mjs tests/src/workspace-state.test.mjs tests/src/workspace-utils.test.mjs tests/src/jobs-utils.test.mjs && node --import tsx --test tests/ui/task-board.test.jsx tests/ui/section-loading.test.jsx tests/ui/workspace-controller.test.jsx tests/ui/app-workflow.test.jsx"
```

- [ ] **Step 3: Run the failing runtime config test**

Run:

```bash
npm test -- tests/src/runtime-config.test.mjs
```

Expected: this command may run the full configured suite because the project script does not forward file filters, but it must fail with a module-not-found error for `src/config/runtimeConfig.js`.

- [ ] **Step 4: Implement runtime config**

Create `src/config/runtimeConfig.js` with exactly:

```js
function readImportMetaEnv() {
  try {
    return import.meta.env ?? {};
  } catch {
    return {};
  }
}

export function normalizeApiBaseUrl(value = "") {
  return String(value).trim().replace(/\/+$/, "");
}

export function createRuntimeConfig(env = readImportMetaEnv()) {
  return {
    apiBaseUrl: normalizeApiBaseUrl(env.VITE_API_BASE_URL ?? ""),
  };
}

export const runtimeConfig = createRuntimeConfig();

export function buildApiUrl(path, config = runtimeConfig) {
  const normalizedPath = String(path).startsWith("/") ? String(path) : `/${path}`;

  if (!config.apiBaseUrl) {
    return normalizedPath;
  }

  return `${config.apiBaseUrl}${normalizedPath}`;
}
```

- [ ] **Step 5: Run runtime config tests**

Run:

```bash
node --test tests/src/runtime-config.test.mjs
```

Expected: PASS with 4 passing subtests.

- [ ] **Step 6: Commit**

Run:

```bash
git add package.json src/config/runtimeConfig.js tests/src/runtime-config.test.mjs
git commit -m "feat: add frontend runtime API config"
```

Expected: commit succeeds.

## Task 3: Route Orchestrator Requests Through Runtime Config

**Files:**
- Modify: `src/services/orchestrator.js`
- Create: `tests/src/orchestrator.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing orchestrator tests**

Create `tests/src/orchestrator.test.mjs` with exactly:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createRuntimeConfig } from "../../src/config/runtimeConfig.js";
import { createOrchestratorClient, getBootstrapData } from "../../src/services/orchestrator.js";

function createResponse(payload, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    headers: {
      get: () => "application/json",
    },
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    },
  };
}

test("createOrchestratorClient prefixes requests with configured API base URL", async () => {
  const calls = [];
  const client = createOrchestratorClient({
    config: createRuntimeConfig({
      VITE_API_BASE_URL: "https://api.example.com/",
    }),
    fetchImpl: async (url, options) => {
      calls.push([url, options]);
      return createResponse({ ok: true });
    },
  });

  const payload = await client.getJobs();

  assert.deepEqual(payload, { ok: true });
  assert.equal(calls[0][0], "https://api.example.com/api/jobs");
  assert.equal(calls[0][1].headers["Content-Type"], "application/json");
});

test("createOrchestratorClient keeps relative requests when base URL is empty", async () => {
  const calls = [];
  const client = createOrchestratorClient({
    config: createRuntimeConfig({}),
    fetchImpl: async (url) => {
      calls.push(url);
      return createResponse({ scenario: { key: "consumer-tech" } });
    },
  });

  await client.getBootstrapData("consumer-tech");

  assert.equal(calls[0], "/api/bootstrap?scenario=consumer-tech");
});

test("default orchestrator exports keep existing public signatures", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url) => {
    calls.push(url);
    return createResponse({ scenario: { key: "consumer-tech" } });
  };

  try {
    await getBootstrapData("consumer-tech");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls[0], "/api/bootstrap?scenario=consumer-tech");
});
```

- [ ] **Step 2: Add orchestrator tests to `npm test`**

In `package.json`, update the `test` script so the first `node --test` command includes `tests/src/orchestrator.test.mjs` after `tests/src/runtime-config.test.mjs`:

```json
"test": "node --test tests/server/domain.test.mjs tests/server/errors.test.mjs tests/server/router.test.mjs tests/server/state-store.test.mjs tests/src/runtime-config.test.mjs tests/src/orchestrator.test.mjs tests/src/generation-utils.test.mjs tests/src/workflow-actions.test.mjs tests/src/workspace-state.test.mjs tests/src/workspace-utils.test.mjs tests/src/jobs-utils.test.mjs && node --import tsx --test tests/ui/task-board.test.jsx tests/ui/section-loading.test.jsx tests/ui/workspace-controller.test.jsx tests/ui/app-workflow.test.jsx"
```

- [ ] **Step 3: Run the failing orchestrator test**

Run:

```bash
node --test tests/src/orchestrator.test.mjs
```

Expected: FAIL because `createOrchestratorClient` is not exported from `src/services/orchestrator.js`.

- [ ] **Step 4: Implement injectable orchestrator client**

Replace `src/services/orchestrator.js` with exactly:

```js
import { buildApiUrl, runtimeConfig } from "../config/runtimeConfig.js";

export async function extractErrorMessage(response) {
  const contentType = response.headers.get("Content-Type") ?? "";
  const raw = await response.text();

  if (!raw) {
    return `Request failed: ${response.status}`;
  }

  if (contentType.includes("application/json")) {
    try {
      const payload = JSON.parse(raw);
      if (payload?.error) {
        return payload.error;
      }
      if (payload?.message) {
        return payload.message;
      }
    } catch {
      return raw;
    }
  }

  try {
    const payload = JSON.parse(raw);
    return payload.error || payload.message || `Request failed: ${response.status}`;
  } catch {
    return raw;
  }
}

export function createOrchestratorClient({ config = runtimeConfig, fetchImpl = globalThis.fetch } = {}) {
  async function request(path, options = {}) {
    const response = await fetchImpl(buildApiUrl(path, config), {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      ...options,
    });

    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message);
    }

    return response.json();
  }

  return {
    getBootstrapData(scenarioKey) {
      const suffix = scenarioKey ? `?scenario=${encodeURIComponent(scenarioKey)}` : "";
      return request(`/api/bootstrap${suffix}`);
    },
    getJobs() {
      return request("/api/jobs");
    },
    getJobDetail(jobId) {
      return request(`/api/jobs/${jobId}`);
    },
    runJobAction(jobId, action, note = "") {
      return request(`/api/jobs/${jobId}/action`, {
        method: "POST",
        body: JSON.stringify({ action, note }),
      });
    },
    addJobNote(jobId, note) {
      return request(`/api/jobs/${jobId}/note`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });
    },
    runWorkflow(scenarioKey) {
      return request("/api/workflow", {
        method: "POST",
        body: JSON.stringify({ scenarioKey }),
      });
    },
    switchScenario(scenarioKey) {
      return request("/api/scenario", {
        method: "POST",
        body: JSON.stringify({ scenarioKey }),
      });
    },
    refreshTopics(scenarioKey) {
      return request("/api/topics/refresh", {
        method: "POST",
        body: JSON.stringify({ scenarioKey }),
      });
    },
    generateDraft({ tone, topicId, topicText, assetMode, scenarioKey }) {
      return request("/api/generate", {
        method: "POST",
        body: JSON.stringify({ tone, topicId, topicText, assetMode, scenarioKey }),
      });
    },
    scheduleDistribution({ scenarioKey }) {
      return request("/api/distribution/schedule", {
        method: "POST",
        body: JSON.stringify({ scenarioKey }),
      });
    },
  };
}

const defaultClient = createOrchestratorClient();

export const getBootstrapData = defaultClient.getBootstrapData;
export const getJobs = defaultClient.getJobs;
export const getJobDetail = defaultClient.getJobDetail;
export const runJobAction = defaultClient.runJobAction;
export const addJobNote = defaultClient.addJobNote;
export const runWorkflow = defaultClient.runWorkflow;
export const switchScenario = defaultClient.switchScenario;
export const refreshTopics = defaultClient.refreshTopics;
export const generateDraft = defaultClient.generateDraft;
export const scheduleDistribution = defaultClient.scheduleDistribution;
```

- [ ] **Step 5: Run orchestrator tests**

Run:

```bash
node --test tests/src/orchestrator.test.mjs
```

Expected: PASS with 3 passing subtests.

- [ ] **Step 6: Commit**

Run:

```bash
git add package.json src/services/orchestrator.js tests/src/orchestrator.test.mjs
git commit -m "feat: route API requests through runtime config"
```

Expected: commit succeeds.

## Task 4: Add Server Environment Configuration

**Files:**
- Modify: `server/config.mjs`
- Create: `tests/server/config.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing server config tests**

Create `tests/server/config.test.mjs` with exactly:

```js
import test from "node:test";
import assert from "node:assert/strict";

async function loadConfig(env = {}) {
  const previousEnv = {
    GEO_PULSE_API_HOST: process.env.GEO_PULSE_API_HOST,
    GEO_PULSE_API_PORT: process.env.GEO_PULSE_API_PORT,
    GEO_PULSE_STATE_FILE: process.env.GEO_PULSE_STATE_FILE,
  };

  delete process.env.GEO_PULSE_API_HOST;
  delete process.env.GEO_PULSE_API_PORT;
  delete process.env.GEO_PULSE_STATE_FILE;
  Object.assign(process.env, env);

  try {
    return await import(`../../server/config.mjs?case=${Date.now()}-${Math.random()}`);
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("server config keeps local defaults", async () => {
  const config = await loadConfig();

  assert.equal(config.HOST, "127.0.0.1");
  assert.equal(config.PORT, 8787);
  assert.match(config.STATE_FILE, /server\/data\/state\.json$/);
});

test("server config reads environment overrides", async () => {
  const config = await loadConfig({
    GEO_PULSE_API_HOST: "0.0.0.0",
    GEO_PULSE_API_PORT: "9876",
    GEO_PULSE_STATE_FILE: "/tmp/geo-pulse-state.json",
  });

  assert.equal(config.HOST, "0.0.0.0");
  assert.equal(config.PORT, 9876);
  assert.equal(config.STATE_FILE, "/tmp/geo-pulse-state.json");
});

test("server config rejects invalid port values", async () => {
  await assert.rejects(
    () =>
      loadConfig({
        GEO_PULSE_API_PORT: "not-a-port",
      }),
    /GEO_PULSE_API_PORT must be an integer between 1 and 65535/,
  );
});
```

- [ ] **Step 2: Add server config tests to `npm test`**

In `package.json`, update the first `node --test` command so it includes `tests/server/config.test.mjs` before `tests/server/domain.test.mjs`:

```json
"test": "node --test tests/server/config.test.mjs tests/server/domain.test.mjs tests/server/errors.test.mjs tests/server/router.test.mjs tests/server/state-store.test.mjs tests/src/runtime-config.test.mjs tests/src/orchestrator.test.mjs tests/src/generation-utils.test.mjs tests/src/workflow-actions.test.mjs tests/src/workspace-state.test.mjs tests/src/workspace-utils.test.mjs tests/src/jobs-utils.test.mjs && node --import tsx --test tests/ui/task-board.test.jsx tests/ui/section-loading.test.jsx tests/ui/workspace-controller.test.jsx tests/ui/app-workflow.test.jsx"
```

- [ ] **Step 3: Run the failing server config test**

Run:

```bash
node --test tests/server/config.test.mjs
```

Expected: FAIL because environment overrides are not implemented.

- [ ] **Step 4: Implement server environment parsing**

Replace `server/config.mjs` with exactly:

```js
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 8787;
export const DEFAULT_STATE_FILE = path.join(__dirname, "data", "state.json");

function parsePort(value) {
  if (value === undefined || value === "") {
    return DEFAULT_PORT;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("GEO_PULSE_API_PORT must be an integer between 1 and 65535");
  }

  return port;
}

export const HOST = process.env.GEO_PULSE_API_HOST || DEFAULT_HOST;
export const PORT = parsePort(process.env.GEO_PULSE_API_PORT);
export const STATE_FILE = process.env.GEO_PULSE_STATE_FILE || DEFAULT_STATE_FILE;
```

- [ ] **Step 5: Run server config tests**

Run:

```bash
node --test tests/server/config.test.mjs
```

Expected: PASS with 3 passing subtests.

- [ ] **Step 6: Commit**

Run:

```bash
git add package.json server/config.mjs tests/server/config.test.mjs
git commit -m "feat: add server environment config"
```

Expected: commit succeeds.

## Task 5: Add Health and Readiness Checks

**Files:**
- Modify: `server/state-store.mjs`
- Modify: `server/router.mjs`
- Modify: `tests/server/router.test.mjs`

- [ ] **Step 1: Extend router tests for health and readiness**

Append these tests to `tests/server/router.test.mjs`:

```js
test("health endpoint returns production metadata", async () => {
  const response = await dispatch({
    method: "GET",
    url: "/api/health",
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.service, "geo-pulse-api");
  assert.equal(response.body.version, "0.1.0");
  assert.equal(response.body.state, "ready");
  assert.match(response.body.date, /^\d{4}-\d{2}-\d{2}T/);
});

test("readiness endpoint confirms state storage is readable", async () => {
  const response = await dispatch({
    method: "GET",
    url: "/api/readiness",
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "ready");
  assert.equal(response.body.service, "geo-pulse-api");
  assert.equal(response.body.state.readable, true);
  assert.match(response.body.date, /^\d{4}-\d{2}-\d{2}T/);
});

test("readiness endpoint reports state storage failures", async () => {
  const request = createRequest({
    method: "GET",
    url: "/api/readiness",
  });
  const response = createResponse();

  await handleRequest(request, response, {
    stateStore: {
      async checkReadiness() {
        throw new Error("invalid state json");
      },
    },
  });

  const body = JSON.parse(response.payload);

  assert.equal(response.statusCode, 503);
  assert.equal(body.status, "not_ready");
  assert.equal(body.service, "geo-pulse-api");
  assert.equal(body.state.readable, false);
  assert.equal(body.state.error, "invalid state json");
});
```

- [ ] **Step 2: Run failing router tests**

Run:

```bash
node --test tests/server/router.test.mjs
```

Expected: FAIL because `/api/health` lacks `version` and `state`, `/api/readiness` does not exist, and `handleRequest` does not accept injected dependencies.

- [ ] **Step 3: Add state readiness helper**

In `server/state-store.mjs`, change the returned object in `createStateStore()` from:

```js
  return {
    readState,
    updateState,
  };
}
```

to:

```js
  async function checkReadiness() {
    await readState();
    return {
      readable: true,
    };
  }

  return {
    readState,
    updateState,
    checkReadiness,
  };
}
```

Then change the named exports at the bottom from:

```js
export const readState = defaultStore.readState;
export const updateState = defaultStore.updateState;
```

to:

```js
export const readState = defaultStore.readState;
export const updateState = defaultStore.updateState;
export const checkReadiness = defaultStore.checkReadiness;
```

- [ ] **Step 4: Implement health metadata, readiness endpoint, and dependency injection**

In `server/router.mjs`, change the imports from:

```js
import { HOST, PORT } from "./config.mjs";
```

and:

```js
import { readState, updateState } from "./state-store.mjs";
```

to:

```js
import packageJson from "../package.json" with { type: "json" };
import { HOST, PORT } from "./config.mjs";
import * as defaultStateStore from "./state-store.mjs";
```

Change the function declaration from:

```js
export async function handleRequest(request, response) {
```

to:

```js
export async function handleRequest(request, response, dependencies = {}) {
  const stateStore = dependencies.stateStore ?? defaultStateStore;
```

Replace every `readState()` call with `stateStore.readState()` and every `updateState(` call with `stateStore.updateState(`.

Replace the `/api/health` block with:

```js
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        status: "ok",
        date: new Date().toISOString(),
        service: "geo-pulse-api",
        version: packageJson.version,
        state: "ready",
      });
      return;
    }
```

Add this block immediately after the `/api/health` block:

```js
    if (request.method === "GET" && url.pathname === "/api/readiness") {
      try {
        const state = await stateStore.checkReadiness();
        sendJson(response, 200, {
          status: "ready",
          date: new Date().toISOString(),
          service: "geo-pulse-api",
          version: packageJson.version,
          state,
        });
      } catch (error) {
        sendJson(response, 503, {
          status: "not_ready",
          date: new Date().toISOString(),
          service: "geo-pulse-api",
          version: packageJson.version,
          state: {
            readable: false,
            error: error instanceof Error ? error.message : "Unknown readiness error",
          },
        });
      }
      return;
    }
```

- [ ] **Step 5: Run router tests**

Run:

```bash
node --test tests/server/router.test.mjs
```

Expected: PASS with existing router tests plus 3 new passing subtests.

- [ ] **Step 6: Run state-store tests**

Run:

```bash
node --test tests/server/state-store.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add server/router.mjs server/state-store.mjs tests/server/router.test.mjs
git commit -m "feat: add API readiness checks"
```

Expected: commit succeeds.

## Task 6: Add Server Request Logging

**Files:**
- Modify: `server/http.mjs`
- Modify: `server/mock-api.mjs`
- Create: `tests/server/http.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write request logging tests**

Create `tests/server/http.test.mjs` with exactly:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { sendJson, withRequestLogging } from "../../server/http.mjs";

function createRequest({ method = "GET", url = "/api/health" } = {}) {
  const request = Readable.from([]);
  request.method = method;
  request.url = url;
  return request;
}

function createResponse() {
  return {
    statusCode: 0,
    headers: {},
    payload: "",
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(chunk = "") {
      this.payload = chunk.toString();
    },
  };
}

test("sendJson stores status code for request logging", () => {
  const response = createResponse();

  sendJson(response, 201, { ok: true });

  assert.equal(response.statusCode, 201);
  assert.equal(JSON.parse(response.payload).ok, true);
});

test("withRequestLogging logs method, path, status, and duration without body", async () => {
  const logs = [];
  const handler = withRequestLogging(
    async (request, response) => {
      sendJson(response, 202, { ok: true });
    },
    {
      logger: {
        info: (message) => logs.push(message),
      },
      now: (() => {
        const values = [100, 137];
        return () => values.shift();
      })(),
    },
  );

  await handler(createRequest({ method: "POST", url: "/api/workflow?token=secret" }), createResponse());

  assert.equal(logs.length, 1);
  assert.match(logs[0], /POST \/api\/workflow 202 37ms/);
  assert.doesNotMatch(logs[0], /token/);
  assert.doesNotMatch(logs[0], /secret/);
});
```

- [ ] **Step 2: Add HTTP tests to `npm test`**

In `package.json`, update the first `node --test` command so it includes `tests/server/http.test.mjs` after `tests/server/errors.test.mjs`:

```json
"test": "node --test tests/server/config.test.mjs tests/server/domain.test.mjs tests/server/errors.test.mjs tests/server/http.test.mjs tests/server/router.test.mjs tests/server/state-store.test.mjs tests/src/runtime-config.test.mjs tests/src/orchestrator.test.mjs tests/src/generation-utils.test.mjs tests/src/workflow-actions.test.mjs tests/src/workspace-state.test.mjs tests/src/workspace-utils.test.mjs tests/src/jobs-utils.test.mjs && node --import tsx --test tests/ui/task-board.test.jsx tests/ui/section-loading.test.jsx tests/ui/workspace-controller.test.jsx tests/ui/app-workflow.test.jsx"
```

- [ ] **Step 3: Run failing HTTP tests**

Run:

```bash
node --test tests/server/http.test.mjs
```

Expected: FAIL because `withRequestLogging` is not exported.

- [ ] **Step 4: Implement request logging wrapper**

In `server/http.mjs`, add this function after `toErrorResponse()`:

```js
function getLogPath(request) {
  try {
    return new URL(request.url ?? "/", "http://localhost").pathname;
  } catch {
    return request.url ?? "/";
  }
}

export function withRequestLogging(handler, { logger = console, now = Date.now } = {}) {
  return async function loggedHandler(request, response) {
    const startedAt = now();

    try {
      await handler(request, response);
    } finally {
      const durationMs = Math.max(0, now() - startedAt);
      const method = request.method ?? "UNKNOWN";
      const path = getLogPath(request);
      const statusCode = response.statusCode || 500;
      logger.info(`${method} ${path} ${statusCode} ${durationMs}ms`);
    }
  };
}
```

Then change `sendJson()` from:

```js
export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
```

to:

```js
export function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.writeHead(statusCode, {
```

- [ ] **Step 5: Wrap the API handler**

In `server/mock-api.mjs`, change:

```js
import { handleRequest } from "./router.mjs";

const server = http.createServer(handleRequest);
```

to:

```js
import { withRequestLogging } from "./http.mjs";
import { handleRequest } from "./router.mjs";

const server = http.createServer(withRequestLogging(handleRequest));
```

- [ ] **Step 6: Run HTTP tests**

Run:

```bash
node --test tests/server/http.test.mjs
```

Expected: PASS with 2 passing subtests.

- [ ] **Step 7: Commit**

Run:

```bash
git add package.json server/http.mjs server/mock-api.mjs tests/server/http.test.mjs
git commit -m "feat: add API request logging"
```

Expected: commit succeeds.

## Task 7: Add React Error Boundary

**Files:**
- Create: `src/components/ErrorBoundary.jsx`
- Modify: `src/main.jsx`
- Create: `tests/ui/error-boundary.test.jsx`
- Modify: `package.json`

- [ ] **Step 1: Write failing error boundary test**

Create `tests/ui/error-boundary.test.jsx` with exactly:

```jsx
import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import ErrorBoundary from "../../src/components/ErrorBoundary.jsx";

function setupDom() {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost",
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });

  return {
    dom,
    container: dom.window.document.getElementById("root"),
  };
}

function cleanupDom(dom) {
  dom.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.HTMLElement;
  delete globalThis.Node;
  delete globalThis.navigator;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
}

function BrokenComponent() {
  throw new Error("render failure");
}

test("ErrorBoundary renders a production fallback for render failures", async () => {
  const { dom, container } = setupDom();
  const root = createRoot(container);
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await act(async () => {
      root.render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>,
      );
    });

    assert.match(container.textContent, /工作台暂时无法渲染/);
    assert.match(container.textContent, /请刷新页面或查看运行日志/);
  } finally {
    console.error = originalConsoleError;
    await act(async () => {
      root.unmount();
    });
    cleanupDom(dom);
  }
});
```

- [ ] **Step 2: Add UI error boundary test to `npm test`**

In `package.json`, update the second test command so it includes `tests/ui/error-boundary.test.jsx` before `tests/ui/app-workflow.test.jsx`:

```json
"test": "node --test tests/server/config.test.mjs tests/server/domain.test.mjs tests/server/errors.test.mjs tests/server/http.test.mjs tests/server/router.test.mjs tests/server/state-store.test.mjs tests/src/runtime-config.test.mjs tests/src/orchestrator.test.mjs tests/src/generation-utils.test.mjs tests/src/workflow-actions.test.mjs tests/src/workspace-state.test.mjs tests/src/workspace-utils.test.mjs tests/src/jobs-utils.test.mjs && node --import tsx --test tests/ui/task-board.test.jsx tests/ui/section-loading.test.jsx tests/ui/workspace-controller.test.jsx tests/ui/error-boundary.test.jsx tests/ui/app-workflow.test.jsx"
```

- [ ] **Step 3: Run failing error boundary test**

Run:

```bash
node --import tsx --test tests/ui/error-boundary.test.jsx
```

Expected: FAIL because `src/components/ErrorBoundary.jsx` does not exist.

- [ ] **Step 4: Implement ErrorBoundary**

Create `src/components/ErrorBoundary.jsx` with exactly:

```jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, info) {
    console.error("App render failed", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell app-shell--error" role="alert">
          <section className="error-boundary">
            <p className="eyebrow">Runtime error</p>
            <h1>工作台暂时无法渲染</h1>
            <p>请刷新页面或查看运行日志，确认最近一次发布没有引入渲染异常。</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
```

- [ ] **Step 5: Wrap the application root**

In `src/main.jsx`, add:

```js
import ErrorBoundary from "./components/ErrorBoundary";
```

Then change the render tree from:

```jsx
  <React.StrictMode>
    <App />
  </React.StrictMode>,
```

to:

```jsx
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
```

- [ ] **Step 6: Run error boundary test**

Run:

```bash
node --import tsx --test tests/ui/error-boundary.test.jsx
```

Expected: PASS with 1 passing subtest.

- [ ] **Step 7: Commit**

Run:

```bash
git add package.json src/components/ErrorBoundary.jsx src/main.jsx tests/ui/error-boundary.test.jsx
git commit -m "feat: add app error boundary"
```

Expected: commit succeeds.

## Task 8: Add Environment Example and Operations Documentation

**Files:**
- Create: `.env.example`
- Create: `docs/operations-runbook.md`
- Create: `docs/release-checklist.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/maintenance-log.md`

- [ ] **Step 1: Create `.env.example`**

Create `.env.example` with exactly:

```dotenv
# Frontend API base URL.
# Leave empty for Vite proxy/local relative requests.
VITE_API_BASE_URL=

# Local API bind host.
GEO_PULSE_API_HOST=127.0.0.1

# Local API port.
GEO_PULSE_API_PORT=8787

# JSON state file used by the local mock API.
GEO_PULSE_STATE_FILE=server/data/state.json
```

- [ ] **Step 2: Create operations runbook**

Create `docs/operations-runbook.md` with exactly:

````md
# Operations Runbook

This runbook covers the current GEO-Pulse local API and Vite frontend baseline.

## Local Startup

```bash
npm install
npm run reset:api-state
npm run dev:api
```

In a second terminal:

```bash
npm run dev
```

## Environment Variables

- `VITE_API_BASE_URL`: frontend API base URL. Leave empty to use relative `/api` requests through the Vite proxy.
- `GEO_PULSE_API_HOST`: local API bind host. Default: `127.0.0.1`.
- `GEO_PULSE_API_PORT`: local API port. Default: `8787`.
- `GEO_PULSE_STATE_FILE`: JSON state file for the local API. Default: `server/data/state.json`.

## Health Checks

Start the API, then run:

```bash
curl -sS http://127.0.0.1:8787/api/health
curl -sS http://127.0.0.1:8787/api/readiness
```

Expected:

- `/api/health` returns HTTP 200 with `status: "ok"`.
- `/api/readiness` returns HTTP 200 with `status: "ready"` when the state file is readable and valid JSON.

## Reset Demo State

Use this before demos and verification runs:

```bash
npm run reset:api-state
```

This rewrites `server/data/state.json` from the seeded domain data.

## Common Failures

- API port already in use: set `GEO_PULSE_API_PORT` to a free port and update `VITE_API_BASE_URL` if the frontend is not using the Vite proxy.
- Readiness returns 503: run `npm run reset:api-state`, then restart `npm run dev:api`.
- Frontend cannot load bootstrap data: confirm the API is running and `/api/readiness` returns 200.
- Build fails after dependency changes: run `npm ci`, then `npm test`, then `npm run build`.

## Recovery Steps

1. Stop the API and frontend dev servers.
2. Run `npm run reset:api-state`.
3. Start `npm run dev:api`.
4. Confirm `/api/health` and `/api/readiness`.
5. Start `npm run dev`.
6. Re-run `npm test` before committing fixes.
````

- [ ] **Step 3: Create release checklist**

Create `docs/release-checklist.md` with exactly:

````md
# Release Checklist

Use this checklist before pushing `main`, opening a release pull request, or tagging a handoff build.

- [ ] `git status --short --branch` shows the intended branch and no unrelated changes.
- [ ] `npm ci` completes successfully.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `CHANGELOG.md` includes the user-facing and operational changes.
- [ ] `docs/maintenance-log.md` includes any maintenance path changes.
- [ ] `.env.example` matches the runtime configuration used by the app and local API.
- [ ] `docs/operations-runbook.md` health and readiness commands still work.
- [ ] No required generated artifacts are ignored by `.gitignore`.
- [ ] Push the branch and confirm GitHub Actions CI completes.
````

- [ ] **Step 4: Update README**

In `README.md`, under the local API endpoint list, add:

```md
- `GET /api/readiness`
```

Then add this section before `## 后续建议`:

```md
## 生产工程基础

- CI: GitHub Actions 在 `main` 的 push 和 pull request 上执行 `npm ci`、`npm test`、`npm run build`。
- 前端配置: `VITE_API_BASE_URL` 控制 API base URL；空值保持当前 `/api` 相对路径。
- API 配置: `GEO_PULSE_API_HOST`、`GEO_PULSE_API_PORT`、`GEO_PULSE_STATE_FILE` 可覆盖本地 API 默认值。
- 健康检查: `/api/health` 表示 HTTP 服务存活，`/api/readiness` 表示状态文件可读取并可解析。
- 运维入口: `docs/operations-runbook.md` 和 `docs/release-checklist.md`。
```

- [ ] **Step 5: Update changelog**

Append this entry near the top of `CHANGELOG.md`:

```md
## 2026-07-05

- Added GitHub Actions CI for install, tests, and production build.
- Added frontend and API environment configuration.
- Added API health/readiness metadata and request logging.
- Added app-level React error boundary.
- Added operations runbook and release checklist.
```

- [ ] **Step 6: Update maintenance log**

Append this entry near the top of `docs/maintenance-log.md`:

```md
## 2026-07-05 Production Engineering Foundation

- Added CI verification path: `.github/workflows/ci.yml`.
- Added runtime configuration paths: `.env.example`, `src/config/runtimeConfig.js`, `server/config.mjs`.
- Added operational checks: `GET /api/health`, `GET /api/readiness`.
- Added operations documents: `docs/operations-runbook.md`, `docs/release-checklist.md`.
- Verification path remains `npm test` followed by `npm run build`.
```

- [ ] **Step 7: Commit**

Run:

```bash
git add .env.example README.md CHANGELOG.md docs/maintenance-log.md docs/operations-runbook.md docs/release-checklist.md
git commit -m "docs: add production operations guidance"
```

Expected: commit succeeds.

## Task 9: Full Verification and Push

**Files:**
- Verify all files changed by Tasks 1-8.

- [ ] **Step 1: Confirm working tree**

Run:

```bash
git status --short --branch
```

Expected: branch is `main`; output has no uncommitted changes except intentional final fixes if earlier tasks required them.

- [ ] **Step 2: Install from lockfile**

Run:

```bash
npm ci
```

Expected: dependencies install successfully with no lockfile mutation.

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm test
```

Expected: all server, source, and UI tests pass. Expected count should be higher than the previous 43 tests because this plan adds runtime config, orchestrator, config, HTTP logging, readiness, and error boundary tests.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: Vite production build completes successfully and writes `dist/`.

- [ ] **Step 5: Remove generated build output if it appears as untracked**

Run:

```bash
git status --short
```

Expected: `dist/` is not tracked. If `dist/` appears as untracked output, remove only `dist/` before committing or pushing because the repository builds it in CI.

- [ ] **Step 6: Push all commits**

Run:

```bash
git push origin main
```

Expected: push succeeds and GitHub Actions CI starts on `main`.

- [ ] **Step 7: Confirm remote branch status**

Run:

```bash
git status --short --branch
```

Expected: `## main...origin/main` and no uncommitted files.

## Self-Review

- Spec coverage: CI is covered by Task 1; frontend and server environment configuration by Tasks 2-4 and Task 8; health/readiness by Task 5 and Task 8; request logging by Task 6; error boundary by Task 7; operations/release docs and README/changelog/maintenance updates by Task 8; full local verification and push by Task 9.
- Placeholder scan: The plan contains no unresolved placeholder markers, no deferred implementation instructions, and every code-changing step includes concrete file content or exact replacement instructions.
- Type consistency: `createRuntimeConfig`, `normalizeApiBaseUrl`, `buildApiUrl`, `createOrchestratorClient`, `checkReadiness`, and `withRequestLogging` are introduced before later tasks reference them. Server readiness dependency injection uses one `stateStore` shape with `readState`, `updateState`, and `checkReadiness`.
