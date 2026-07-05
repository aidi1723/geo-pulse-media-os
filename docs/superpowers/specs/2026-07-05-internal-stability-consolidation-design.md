# GEO-Pulse Internal Stability Consolidation Design

Date: 2026-07-05

## Goal

Reduce the remaining workflow responsibility inside `src/App.jsx` and harden the frontend API contract before real backend integrations are added.

This phase is an internal stability pass. It does not add real ingestion, AI generation, publishing, authentication, database persistence, or new UI flows.

## Current Baseline

The project now has a production engineering foundation:

- GitHub Actions CI runs install, tests, and build on `main`.
- Runtime API configuration is centralized in `src/config/runtimeConfig.js`.
- Frontend API calls are routed through `src/services/orchestrator.js`.
- The local API has health/readiness endpoints, request logging, and environment overrides.
- The app has an app-level `ErrorBoundary`.
- `npm test` currently covers 67 tests.

The main remaining frontend concentration is in `src/App.jsx`:

- `handleSaveNote()` directly owns note validation, `addJobNote`, selected job updates, job list updates, banner updates, note clearing, error clearing, and busy state.
- `handleJobAction(action)` directly owns `runJobAction`, selected job updates, job list updates, banner updates, highlighted channel clearing, note clearing, error clearing, and busy state.
- `handleOpenWorkspaceFromJob()` directly owns artifact type routing, cross-scenario bootstrap loading, selected topic mapping, copy preview updates, tone/asset mode updates, highlighted channel updates, active view switching, banner updates, and busy/error state.

These functions work, but they make `App.jsx` carry workflow behavior that is better isolated before real API contracts are introduced.

## Proposed Approach

Use a narrow refactor that follows the existing `createWorkflowActions()` pattern:

1. Add `src/actions/jobActions.js` for task note and task action mutations.
2. Add `src/actions/artifactRouting.js` for routing from a selected job artifact back into the correct workspace view.
3. Expand `tests/src/orchestrator.test.mjs` to lock down request paths, HTTP methods, request bodies, configured base URL behavior, and error throwing.
4. Update `App.jsx` to delegate to the new action modules while preserving UI behavior.
5. Update docs to reflect the new maintenance paths.

This keeps the change small, testable, and aligned with the current codebase.

## Non-Goals

This phase will not:

- Add a real database.
- Add login, RBAC, tenants, or sessions.
- Connect real AI model APIs.
- Connect real publishing platforms.
- Add queues, workers, Redis, or scheduled background tasks.
- Replace the hand-written local API router.
- Redesign the UI.
- Add a schema validation dependency.

## Architecture

### 1. Job Actions

Add:

- `src/actions/jobActions.js`
- `tests/src/job-actions.test.mjs`

Shape:

```js
export function createJobActions({ services, workspace, ui, getState }) {
  return {
    saveNote,
    runAction,
  };
}
```

Inputs:

- `services.addJobNote(jobId, note)`
- `services.runJobAction(jobId, action, note)`
- `workspace.setSelectedJob(job)`
- `workspace.setJobs(jobs)`
- `workspace.setBanner(message)`
- `ui.setJobActionBusy(value)`
- `ui.setHighlightedChannelNames(value)`
- `ui.setJobNoteDraft(value)`
- `ui.setAppError(value)`
- `getState()` returning:
  - `selectedJobId`
  - `jobNoteDraft`

Behavior:

- `saveNote()` returns immediately when there is no selected job or trimmed note is empty.
- `saveNote()` sets busy state to `"note"`, calls `addJobNote`, updates selected job/jobs/banner, clears note draft and app error, then clears busy state.
- `saveNote()` sets app error on failure and still clears busy state.
- `runAction(action)` returns immediately when there is no selected job.
- `runAction(action)` sets busy state to the action value, calls `runJobAction(selectedJobId, action, trimmedNote)`, updates selected job/jobs/banner, clears highlighted channels, clears note draft and app error, then clears busy state.
- `runAction(action)` sets app error on failure and still clears busy state.

App impact:

- `App.jsx` should create `jobActions` similarly to `workflowActions`.
- `TaskBoard` props remain the same.
- No UI copy changes.

### 2. Artifact Routing

Add:

- `src/actions/artifactRouting.js`
- `tests/src/artifact-routing.test.mjs`

Shape:

```js
export async function openWorkspaceFromJob({ selectedJob, scenarioKey, topics, services, workspace, ui }) {
  // ...
}
```

Inputs:

- `selectedJob`
- current `scenarioKey`
- current `topics`
- `services.loadScenarioContext(nextScenarioKey)`
- `workspace.setSelectedTopic(value)`
- `workspace.setCopyPreview(value)`
- `workspace.setTone(value)`
- `workspace.setAssetMode(value)`
- `workspace.setBanner(value)`
- `ui.setActiveView(value)`
- `ui.setHighlightedChannelNames(value)`
- `ui.setBusyAction(value)`
- `ui.setAppError(value)`

Behavior:

- Return immediately when `selectedJob` is missing.
- Set busy state to `"open-workspace"` while routing.
- If the job scenario differs from the active scenario, call `loadScenarioContext(selectedJob.scenarioKey)` and use its `topics` for topic matching.
- For `artifact.type === "copy_draft"`:
  - Match the topic by `artifact.title` against the active or loaded topics.
  - Use `createTopicPayload(matchTopic)` when a match exists.
  - Use fallback text `${artifact.title}\n\n来自任务产物预览` when no match exists.
  - Set `copyPreview` when `artifact.content` exists.
  - Set `tone` when `artifact.tone` exists.
  - Set `assetMode` when `artifact.assetMode` exists.
  - Set active view to `"studio"`.
  - Clear highlighted channels.
  - Set banner to `已从任务“${selectedJob.label}”回到创作舱。`.
- For `artifact.type === "distribution_plan"`:
  - Set active view to `"distribution"`.
  - Highlight `artifact.channels.map((channel) => channel.name)`.
  - Set banner to `已从任务“${selectedJob.label}”定位到对应分发排期。`.
- For `artifact.type === "topic_refresh"`:
  - Set active view to `"discovery"`.
  - Clear highlighted channels.
  - Set banner to `已从任务“${selectedJob.label}”回到选题雷达。`.
- Unknown or missing artifact types should clear busy state and otherwise make no workspace changes.
- On service failure, set app error to `error.message` and clear busy state.

App impact:

- `App.jsx` keeps `loadScenarioContext(nextKey)` as a local helper because it already composes `getBootstrapData()` and `applyWorkspacePayload()`.
- `handleOpenWorkspaceFromJob()` becomes a call to `openWorkspaceFromJob(...)`.
- Existing `TaskBoard` props remain unchanged.

### 3. Orchestrator Contract Tests

Modify:

- `tests/src/orchestrator.test.mjs`

No new dependency is introduced.

Add focused tests that lock:

- `runWorkflow("consumer-tech")` posts to `/api/workflow` with body `{ scenarioKey: "consumer-tech" }`.
- `switchScenario("beauty-skincare")` posts to `/api/scenario` with body `{ scenarioKey: "beauty-skincare" }`.
- `refreshTopics("education-knowledge")` posts to `/api/topics/refresh` with body `{ scenarioKey: "education-knowledge" }`.
- `generateDraft(payload)` posts to `/api/generate` with the full generation payload.
- `scheduleDistribution({ scenarioKey })` posts to `/api/distribution/schedule` with body `{ scenarioKey }`.
- `runJobAction(jobId, action, note)` posts to `/api/jobs/:jobId/action` with body `{ action, note }`.
- `addJobNote(jobId, note)` posts to `/api/jobs/:jobId/note` with body `{ note }`.
- Failed responses throw the extracted error message.

These tests should use `createOrchestratorClient({ config, fetchImpl })` and inspect recorded URL/options. They should not hit the real local API.

## Data Flow

Job mutation flow:

```text
TaskBoard event -> App handler -> jobActions -> orchestrator service -> workspace/ui setters
```

Artifact routing flow:

```text
TaskBoard open workspace -> App handler -> artifactRouting -> optional scenario bootstrap -> workspace/ui setters
```

API contract flow:

```text
orchestrator method -> buildApiUrl -> fetchImpl(url, options) -> error extraction or JSON payload
```

## Testing Strategy

Add tests:

- `tests/src/job-actions.test.mjs`
  - save note no-op with missing job or blank note.
  - save note success.
  - save note failure clears busy and sets app error.
  - job action success.
  - job action failure clears busy and sets app error.
- `tests/src/artifact-routing.test.mjs`
  - copy draft routes to studio with matched topic payload.
  - copy draft routes to studio with fallback topic text when no topic matches.
  - copy draft loads another scenario when needed.
  - distribution plan routes to distribution and highlights channels.
  - topic refresh routes to discovery and clears highlights.
  - missing selected job is a no-op.
  - service failure sets app error and clears busy.
- `tests/src/orchestrator.test.mjs`
  - request path/method/body contract tests listed above.
  - failed response throws extracted API error.

Update `package.json` so new test files run under `npm test`.

Existing tests must continue passing:

- `npm test`
- `npm run build`

## Documentation Updates

Update:

- `README.md`
- `CHANGELOG.md`
- `docs/maintenance-log.md`

Documentation should note:

- Job note/action behavior now lives in `src/actions/jobActions.js`.
- Artifact-to-workspace routing now lives in `src/actions/artifactRouting.js`.
- Orchestrator tests now lock frontend request contracts before real API integration.

## Rollback Strategy

All changes are local source/test/docs changes.

Rollback is standard git rollback:

```bash
git revert <commit>
```

No external state, database migration, or deployment artifact is introduced.

## Success Criteria

This phase is complete when:

- `App.jsx` delegates job note/action behavior to `createJobActions()`.
- `App.jsx` delegates artifact routing behavior to `openWorkspaceFromJob()`.
- Existing UI behavior remains unchanged.
- Orchestrator request contracts are covered by focused tests.
- `npm test` passes.
- `npm run build` passes.
- README, changelog, and maintenance log reflect the new maintenance paths.
- Changes are committed and pushed to `main`.

## Open Questions

No product-scope decisions are required for this phase.

Later phases still need separate specs for:

- Production persistence.
- Authentication and tenant isolation.
- Real topic ingestion.
- Real AI generation.
- Real publishing adapters.
