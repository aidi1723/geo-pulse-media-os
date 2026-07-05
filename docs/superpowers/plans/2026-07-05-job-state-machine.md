# Job State Machine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract job action transition rules from `server/domain.mjs` into a focused, pure state machine module.

**Architecture:** Add `server/job-state-machine.mjs` with `getAvailableJobActions()` and `transitionJobForAction()`. Keep `server/domain.mjs` responsible for state lookup, notes, history, and persistence-facing mutation.

**Tech Stack:** Node 22, ES modules, `node:test`, plain JavaScript.

---

## File Structure

- Create `server/job-state-machine.mjs`: pure action availability and transition rules.
- Create `tests/server/job-state-machine.test.mjs`: focused unit tests for state transition behavior.
- Modify `server/domain.mjs`: import and use the state machine functions.
- Modify `package.json`: add the new server test to the default `npm test` script.
- Modify `CHANGELOG.md`: record the server state machine extraction.
- Modify `docs/maintenance-log.md`: update maintenance paths and recent update record.

## Task 1: Add State Machine Tests

**Files:**

- Create: `tests/server/job-state-machine.test.mjs`

- [ ] **Step 1: Write failing tests**

Create tests that import:

```js
import { getAvailableJobActions, transitionJobForAction } from "../../server/job-state-machine.mjs";
```

Cover:

- pending review completed generation exposes `retry`, `approve`, and `reject`
- queued pending review distribution exposes `retry`, `cancel`, `approve`, and `reject`
- failed and canceled jobs expose only `retry`
- approving a generation job sets `reviewStatus: "approved"` and keeps `status: "completed"`
- approving a queued distribution job sets `reviewStatus: "approved"` and `status: "running"`
- rejecting a job sets `reviewStatus: "rejected"` and `status: "failed"`
- retrying a generation job increments `retryCount`, sets `reviewStatus: "pending_review"`, `status: "completed"`, and `completedAt` to `now`
- retrying a distribution job increments `retryCount`, sets `reviewStatus: "pending_review"`, `status: "queued"`, and removes `completedAt`
- canceling a pending review job sets `status: "canceled"` and `reviewStatus: "rejected"`
- disallowed actions throw `Action not allowed: <action>`

- [ ] **Step 2: Verify tests fail**

Run:

```bash
node --test tests/server/job-state-machine.test.mjs
```

Expected: fail with module not found for `server/job-state-machine.mjs`.

## Task 2: Implement State Machine

**Files:**

- Create: `server/job-state-machine.mjs`

- [ ] **Step 1: Implement pure functions**

Create:

```js
import { ApiError } from "./http.mjs";

export function getAvailableJobActions(job) {}
export function transitionJobForAction(job, action, { now }) {}
```

The implementation should preserve existing transition behavior from `server/domain.mjs`.

- [ ] **Step 2: Verify focused tests pass**

Run:

```bash
node --test tests/server/job-state-machine.test.mjs
```

Expected: all new state machine tests pass.

## Task 3: Wire Domain Module

**Files:**

- Modify: `server/domain.mjs`
- Modify: `package.json`

- [ ] **Step 1: Replace local action availability logic**

Import:

```js
import { getAvailableJobActions, transitionJobForAction } from "./job-state-machine.mjs";
```

Use `getAvailableJobActions(fullJob)` in `enrichJob()`.

- [ ] **Step 2: Replace inline transition block**

Inside `applyJobAction()`, replace direct action-specific mutation with:

```js
const transitionedJob = transitionJobForAction(nextJob, action, { now });
Object.assign(nextJob, transitionedJob);
```

Keep note, history, `lastActionAt`, `updatedJob`, and `state.updatedAt` behavior in `domain.mjs`.

- [ ] **Step 3: Add test file to npm script**

Add `tests/server/job-state-machine.test.mjs` after `tests/server/http.test.mjs` in `package.json`.

- [ ] **Step 4: Verify related tests**

Run:

```bash
node --test tests/server/job-state-machine.test.mjs tests/server/domain.test.mjs tests/server/router.test.mjs
```

Expected: all related server tests pass.

## Task 4: Documentation and Final Verification

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `docs/maintenance-log.md`

- [ ] **Step 1: Update docs**

Record that job state transition rules live in `server/job-state-machine.mjs` and are covered by dedicated tests.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: all pass.

- [ ] **Step 3: Commit and push**

Run:

```bash
git add server/job-state-machine.mjs tests/server/job-state-machine.test.mjs server/domain.mjs package.json CHANGELOG.md docs/maintenance-log.md docs/superpowers/specs/2026-07-05-job-state-machine-design.md docs/superpowers/plans/2026-07-05-job-state-machine.md
git commit -m "refactor: extract job state machine"
git push origin main
```

- [ ] **Step 4: Confirm CI**

Run:

```bash
gh run list --limit 1
gh run watch <run-id> --exit-status
```

Expected: CI completes successfully.
