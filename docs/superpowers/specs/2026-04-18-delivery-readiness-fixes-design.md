# Delivery Readiness Fixes Design

## Scope

This design covers the three delivery blockers identified during review:

1. Generated drafts must reflect the selected scenario and topic instead of reusing a fixed AI hardware template.
2. The workflow endpoint must create a believable end-to-end execution chain instead of only creating a placeholder workflow job.
3. API and frontend error handling must expose user-readable errors with correct HTTP semantics.

It also includes two supporting fixes that reduce demo risk:

- Frontend task selection should move to the latest relevant task after scenario switches and workflow execution.
- Local mock state must be resettable to a clean seed so demos remain repeatable.

## Approach Options

### Option A: Rewrite the mock backend around a more realistic service model

Pros:

- Cleaner long-term abstraction
- Easier future migration to real services

Cons:

- Too much change for the current goal
- High regression risk in a small prototype repo

### Option B: Fix behavior in the current architecture with better domain logic

Pros:

- Smallest safe change
- Preserves existing UI and API shapes
- Fastest path to delivery readiness

Cons:

- Still a mock architecture
- Some behavior remains simulated rather than production-grade

### Option C: Remove the misleading features and label them as placeholders

Pros:

- Lowest engineering effort
- Honest product framing

Cons:

- Reduces demo value
- Leaves the core product story incomplete

## Recommendation

Choose **Option B**. The project is already a local prototype, so the right move is to make the existing flows internally consistent and testable without expanding scope into a backend rewrite.

## Design

### Draft generation

Replace the fixed `toneVariants[*].output` reuse pattern with a small scenario-aware draft composer.

Inputs:

- `scenarioKey`
- `topic.title`
- `topic.summary`
- `topic.angle`
- `tone`
- `assetMode`

Behavior:

- The generated title and body must incorporate the selected topic.
- Tone still shapes the structure and wording style.
- Scenario influences examples, context, and CTA wording.
- The artifact preview stored on generation jobs must contain the full dynamic draft.

Non-goal:

- Integrating a real LLM or content service.

### Workflow execution

Keep a workflow summary job, but make workflow execution create the downstream jobs it claims to have started.

Behavior:

- `POST /api/workflow` creates:
  - one workflow summary job
  - one refreshed topic-ingestion job
  - one generation job using the top topic and default tone/asset mode
  - one distribution job for the same scenario
- The workflow job stores references to created child jobs in its payload.
- The response includes a `focusJobId` pointing to the most useful follow-up job for the UI.

### Error handling

Introduce structured application errors with explicit HTTP status codes.

Cases:

- malformed JSON body -> `400`
- missing job -> `404`
- action not allowed in current state -> `409`
- unknown route -> `404`
- unexpected exceptions -> `500`

Frontend fetch helpers should parse JSON error bodies and surface the message only, not the raw JSON string.

### Demo state reset

Make initial state deterministic and resettable.

Behavior:

- Seed jobs use stable IDs and seed timestamps.
- A reset script restores `server/data/state.json` to the clean initial state.
- README documents the reset flow for demo prep.

### Frontend task focus

After workflow execution and scenario switches, the UI should select the newest relevant task instead of preserving a stale selection from another scenario.

## Testing Strategy

- Add Node test-runner coverage for domain draft generation behavior.
- Add Node test-runner coverage for workflow fan-out behavior.
- Add unit coverage for API error classification and frontend error parsing helpers.
- Run full test suite plus production build before claiming completion.
