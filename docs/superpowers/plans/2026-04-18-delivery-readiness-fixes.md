# Delivery Readiness Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the prototype credible for delivery review by fixing misleading generation behavior, fake workflow execution, weak error handling, and unstable demo state.

**Architecture:** Keep the existing Vite + local mock API structure, but strengthen the domain layer so API responses and UI behavior match product claims. The work is intentionally incremental: add tests first, then improve domain composition, route error semantics, and frontend task focus without rewriting the app.

**Tech Stack:** React 19, Vite 7, Node.js ESM, built-in `node:test`

---

### Task 1: Add failing backend behavior tests

**Files:**
- Create: `tests/server/domain.test.mjs`
- Test: `tests/server/domain.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildDraft, createInitialState, createWorkflowBundle } from "../../server/domain.mjs";

test("buildDraft uses selected topic content instead of fixed hardware copy", () => {
  const draft = buildDraft({
    scenarioKey: "beauty",
    tone: "小红书种草风",
    topic: {
      title: "敏感肌春夏换季维稳怎么选？",
      summary: "用户对成分安全、肤感和真实修护周期最敏感。",
      angle: "机会点: 维稳清单 + 对比图",
    },
    topicText: "敏感肌春夏换季维稳怎么选？",
    assetMode: "图文封面 + 正文排版",
  });

  assert.match(draft.content, /敏感肌春夏换季维稳怎么选/);
  assert.doesNotMatch(draft.content, /AI 硬件这波真的别盲冲/);
});

test("createWorkflowBundle creates ingestion, generation and distribution jobs", () => {
  const state = createInitialState();
  const bundle = createWorkflowBundle(state, "consumer-tech");

  assert.equal(bundle.jobs.topicIngestion[0].label, "工作流已启动");
  assert.equal(bundle.jobs.generation[0].kind, "generation");
  assert.equal(bundle.jobs.distribution[0].kind, "distribution");
  assert.ok(bundle.focusJobId);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/server/domain.test.mjs`
Expected: FAIL because `buildDraft()` still emits fixed hardware copy and `createWorkflowBundle()` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement a scenario-aware draft builder and a workflow bundling helper in `server/domain.mjs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/server/domain.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/server/domain.test.mjs server/domain.mjs
git commit -m "test: cover dynamic draft generation and workflow fan-out"
```

### Task 2: Add failing error-handling tests

**Files:**
- Create: `tests/server/errors.test.mjs`
- Modify: `server/http.mjs`
- Modify: `src/services/orchestrator.js`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, toErrorResponse } from "../../server/http.mjs";
import { extractErrorMessage } from "../../src/services/orchestrator.js";

test("toErrorResponse maps ApiError to status and message", () => {
  const payload = toErrorResponse(new ApiError(409, "Action not allowed"));
  assert.deepEqual(payload, {
    statusCode: 409,
    body: { error: "Action not allowed" },
  });
});

test("extractErrorMessage prefers JSON error fields", async () => {
  const response = new Response(JSON.stringify({ error: "Job not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });

  assert.equal(await extractErrorMessage(response), "Job not found");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/server/errors.test.mjs`
Expected: FAIL because the helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create structured error helpers in `server/http.mjs` and export a frontend message extractor from `src/services/orchestrator.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/server/errors.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/server/errors.test.mjs server/http.mjs src/services/orchestrator.js
git commit -m "test: cover structured api errors"
```

### Task 3: Wire workflow and error handling into routes

**Files:**
- Modify: `server/router.mjs`
- Test: `tests/server/domain.test.mjs`
- Test: `tests/server/errors.test.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions that the router-facing helpers return `focusJobId` and status-aware errors.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/server/domain.test.mjs tests/server/errors.test.mjs`
Expected: FAIL until routes use the new helpers.

- [ ] **Step 3: Write minimal implementation**

Update `server/router.mjs` to:

- use `createWorkflowBundle()`
- return `focusJobId`
- throw `ApiError` for 404/409/400 cases
- send mapped HTTP responses in the catch block

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/server/domain.test.mjs tests/server/errors.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/router.mjs tests/server/domain.test.mjs tests/server/errors.test.mjs
git commit -m "feat: wire workflow fan-out and status-aware route errors"
```

### Task 4: Fix frontend task focus and state reset flow

**Files:**
- Modify: `src/App.jsx`
- Modify: `server/domain.mjs`
- Create: `server/reset-state.mjs`
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**

Add or extend tests to assert deterministic seed IDs in `createInitialState()`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/server/domain.test.mjs`
Expected: FAIL until seed data is deterministic.

- [ ] **Step 3: Write minimal implementation**

Implement stable seed jobs, add `npm run reset:api-state`, and update `src/App.jsx` so workflow/scenario changes replace stale selected tasks with the newest relevant job.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/server/domain.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx server/domain.mjs server/reset-state.mjs package.json README.md
git commit -m "feat: stabilize demo state and task focus"
```

### Task 5: Final verification

**Files:**
- Test: `tests/server/domain.test.mjs`
- Test: `tests/server/errors.test.mjs`

- [ ] **Step 1: Run backend tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Run smoke API checks**

Run:

```bash
npm run reset:api-state
node server/mock-api.mjs
curl -sS http://127.0.0.1:8787/api/health
curl -sS -X POST http://127.0.0.1:8787/api/workflow -H 'Content-Type: application/json' -d '{"scenarioKey":"consumer-tech"}'
```

Expected:

- health returns `{"status":"ok"}`
- workflow returns new generation/distribution jobs plus `focusJobId`

- [ ] **Step 4: Commit**

```bash
git add README.md package.json src/App.jsx server/*.mjs tests/server/*.mjs
git commit -m "chore: finalize delivery readiness fixes"
```
