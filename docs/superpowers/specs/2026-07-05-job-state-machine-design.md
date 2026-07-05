# GEO-Pulse Job State Machine Design

Date: 2026-07-05

## Goal

Move task action transition rules out of `server/domain.mjs` into a focused server module so approval, rejection, retry, and cancellation behavior is easier to test before real queue or worker integrations are added.

## Current Baseline

`server/domain.mjs` currently owns both broad domain operations and the low-level job transition rules used by `applyJobAction()`.

The current rules are:

- `retry` is available for every job.
- `cancel` is available when `status` is `queued` or `running`.
- `approve` and `reject` are available when `reviewStatus` is `pending_review`.
- failed or canceled jobs only expose `retry`.
- `approve` marks review as approved and starts queued distribution jobs.
- `reject` marks review as rejected and fails the job.
- `retry` increments `retryCount`, refreshes timestamps, returns distribution jobs to `queued`, and returns other jobs to `completed`.
- `cancel` marks the job canceled and rejects pending review jobs.

These behaviors are working, but they are implicit inside `domain.mjs`.

## Proposed Approach

Add `server/job-state-machine.mjs` with pure functions:

```js
export function getAvailableJobActions(job) {}
export function transitionJobForAction(job, action, { now }) {}
```

`server/domain.mjs` will continue to:

- locate jobs in state buckets
- normalize job metadata
- add operator notes
- add history entries
- update `state.updatedAt`

The new state machine module will own:

- action availability
- action validation
- status and review status transitions
- `retryCount`, timestamp, `resultSummary`, `detail`, and `reviewComment` transition fields

## Non-Goals

This phase will not add:

- queues or workers
- database persistence
- authentication or tenant logic
- new API endpoints
- UI changes
- schema validation dependencies

## Testing

Add `tests/server/job-state-machine.test.mjs` to cover:

- available actions for pending review, queued, running, failed, and canceled jobs
- approve behavior for completed generation jobs
- approve behavior for queued distribution jobs
- reject behavior
- retry behavior for generation and distribution jobs
- cancel behavior for pending review jobs
- invalid action rejection

The existing domain and router tests must continue to pass.

## Documentation

Update:

- `CHANGELOG.md`
- `docs/maintenance-log.md`

Record that job state transitions now live in `server/job-state-machine.mjs`.
