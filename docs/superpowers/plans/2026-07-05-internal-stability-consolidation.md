# Internal Stability Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move remaining job mutation and artifact-routing behavior out of `src/App.jsx`, and lock the frontend API service contract with focused tests.

**Architecture:** Follow the existing action-factory pattern used by `src/actions/workflowActions.js`. Add focused action modules with dependency-injected services, workspace setters, UI setters, and state readers; keep `App.jsx` as the wiring layer; extend orchestrator tests without adding schema dependencies.

**Tech Stack:** React 19, Vite 7, Node 22, `node:test`, JSDOM, plain JavaScript modules.

---

## File Structure

- Create `src/actions/jobActions.js`: owns task note saving and task action execution.
- Create `tests/src/job-actions.test.mjs`: pure unit tests for job action success, no-op, and failure paths.
- Create `src/actions/artifactRouting.js`: owns routing from selected job artifacts back into workspace views.
- Create `tests/src/artifact-routing.test.mjs`: pure unit tests for artifact routing behavior and cross-scenario loading.
- Modify `src/App.jsx`: wire `createJobActions()` and `openWorkspaceFromJob()` into existing handlers.
- Modify `tests/src/orchestrator.test.mjs`: add request contract tests for all service methods and failure throwing.
- Modify `package.json`: add new source test files to `npm test`.
- Modify `README.md`, `CHANGELOG.md`, `docs/maintenance-log.md`: document new maintenance paths.

## Task 1: Extract Job Actions

**Files:**
- Create: `src/actions/jobActions.js`
- Create: `tests/src/job-actions.test.mjs`
- Modify: `src/App.jsx`
- Modify: `package.json`

- [ ] **Step 1: Write failing job action tests**

Create `tests/src/job-actions.test.mjs` with exactly:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createJobActions } from "../../src/actions/jobActions.js";

function createRecorder() {
  const calls = [];

  return {
    calls,
    workspace: {
      setSelectedJob: (value) => calls.push(["selectedJob", value]),
      setJobs: (value) => calls.push(["jobs", value]),
      setBanner: (value) => calls.push(["banner", value]),
    },
    ui: {
      setJobActionBusy: (value) => calls.push(["busy", value]),
      setHighlightedChannelNames: (value) => calls.push(["highlighted", value]),
      setJobNoteDraft: (value) => calls.push(["noteDraft", value]),
      setAppError: (value) => calls.push(["error", value]),
    },
  };
}

const jobs = {
  topicIngestion: [],
  generation: [{ id: "job-1", scenarioKey: "consumer-tech" }],
  distribution: [],
};

test("saveNote no-ops when no job is selected", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      addJobNote: async () => {
        throw new Error("should not call service");
      },
      runJobAction: async () => {
        throw new Error("should not call service");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "",
      jobNoteDraft: "需要保存",
    }),
  });

  await actions.saveNote();

  assert.deepEqual(recorder.calls, []);
});

test("saveNote no-ops when note is blank", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      addJobNote: async () => {
        throw new Error("should not call service");
      },
      runJobAction: async () => {
        throw new Error("should not call service");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "job-1",
      jobNoteDraft: "   ",
    }),
  });

  await actions.saveNote();

  assert.deepEqual(recorder.calls, []);
});

test("saveNote updates selected job, jobs, banner, note draft, and error", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      addJobNote: async (jobId, note) => {
        assert.equal(jobId, "job-1");
        assert.equal(note, "复核封面");

        return {
          job: { id: "job-1", label: "生成任务" },
          jobs,
          banner: "备注已保存",
        };
      },
      runJobAction: async () => {
        throw new Error("should not call service");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "job-1",
      jobNoteDraft: "  复核封面  ",
    }),
  });

  await actions.saveNote();

  assert.deepEqual(recorder.calls, [
    ["busy", "note"],
    ["selectedJob", { id: "job-1", label: "生成任务" }],
    ["jobs", jobs],
    ["banner", "备注已保存"],
    ["noteDraft", ""],
    ["error", ""],
    ["busy", ""],
  ]);
});

test("saveNote reports service failures and clears busy state", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      addJobNote: async () => {
        throw new Error("备注失败");
      },
      runJobAction: async () => {
        throw new Error("should not call service");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "job-1",
      jobNoteDraft: "备注",
    }),
  });

  await actions.saveNote();

  assert.deepEqual(recorder.calls, [
    ["busy", "note"],
    ["error", "备注失败"],
    ["busy", ""],
  ]);
});

test("runAction updates selected job, jobs, banner, highlights, note draft, and error", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      addJobNote: async () => {
        throw new Error("should not call service");
      },
      runJobAction: async (jobId, action, note) => {
        assert.equal(jobId, "job-1");
        assert.equal(action, "approve");
        assert.equal(note, "同意发布");

        return {
          job: { id: "job-1", status: "completed" },
          jobs,
          banner: "任务已通过",
        };
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "job-1",
      jobNoteDraft: " 同意发布 ",
    }),
  });

  await actions.runAction("approve");

  assert.deepEqual(recorder.calls, [
    ["busy", "approve"],
    ["selectedJob", { id: "job-1", status: "completed" }],
    ["jobs", jobs],
    ["banner", "任务已通过"],
    ["highlighted", []],
    ["noteDraft", ""],
    ["error", ""],
    ["busy", ""],
  ]);
});

test("runAction no-ops when no job is selected", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      addJobNote: async () => {
        throw new Error("should not call service");
      },
      runJobAction: async () => {
        throw new Error("should not call service");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "",
      jobNoteDraft: "备注",
    }),
  });

  await actions.runAction("retry");

  assert.deepEqual(recorder.calls, []);
});

test("runAction reports service failures and clears busy state", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      addJobNote: async () => {
        throw new Error("should not call service");
      },
      runJobAction: async () => {
        throw new Error("动作失败");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "job-1",
      jobNoteDraft: "备注",
    }),
  });

  await actions.runAction("retry");

  assert.deepEqual(recorder.calls, [
    ["busy", "retry"],
    ["error", "动作失败"],
    ["busy", ""],
  ]);
});
```

- [ ] **Step 2: Add job action tests to `npm test`**

In `package.json`, update the first `node --test` command so `tests/src/job-actions.test.mjs` appears after `tests/src/generation-utils.test.mjs` and before `tests/src/workflow-actions.test.mjs`:

```json
"test": "node --test tests/server/config.test.mjs tests/server/display-url.test.mjs tests/server/domain.test.mjs tests/server/errors.test.mjs tests/server/http.test.mjs tests/server/router.test.mjs tests/server/state-store.test.mjs tests/src/runtime-config.test.mjs tests/src/orchestrator.test.mjs tests/src/generation-utils.test.mjs tests/src/job-actions.test.mjs tests/src/workflow-actions.test.mjs tests/src/workspace-state.test.mjs tests/src/workspace-utils.test.mjs tests/src/jobs-utils.test.mjs && node --import tsx --test tests/ui/task-board.test.jsx tests/ui/section-loading.test.jsx tests/ui/workspace-controller.test.jsx tests/ui/error-boundary.test.jsx tests/ui/app-workflow.test.jsx"
```

- [ ] **Step 3: Run failing focused test**

Run:

```bash
node --test tests/src/job-actions.test.mjs
```

Expected: FAIL with module-not-found for `src/actions/jobActions.js`.

- [ ] **Step 4: Implement `createJobActions()`**

Create `src/actions/jobActions.js` with exactly:

```js
export function createJobActions({ services, workspace, ui, getState }) {
  async function saveNote() {
    const { selectedJobId, jobNoteDraft } = getState();
    const note = jobNoteDraft.trim();

    if (!selectedJobId || !note) {
      return;
    }

    ui.setJobActionBusy("note");
    try {
      const result = await services.addJobNote(selectedJobId, note);
      workspace.setSelectedJob(result.job);
      workspace.setJobs(result.jobs);
      workspace.setBanner(result.banner);
      ui.setJobNoteDraft("");
      ui.setAppError("");
    } catch (error) {
      ui.setAppError(error.message);
    } finally {
      ui.setJobActionBusy("");
    }
  }

  async function runAction(action) {
    const { selectedJobId, jobNoteDraft } = getState();

    if (!selectedJobId) {
      return;
    }

    ui.setJobActionBusy(action);
    try {
      const result = await services.runJobAction(selectedJobId, action, jobNoteDraft.trim());
      workspace.setSelectedJob(result.job);
      workspace.setJobs(result.jobs);
      workspace.setBanner(result.banner);
      ui.setHighlightedChannelNames([]);
      ui.setJobNoteDraft("");
      ui.setAppError("");
    } catch (error) {
      ui.setAppError(error.message);
    } finally {
      ui.setJobActionBusy("");
    }
  }

  return {
    saveNote,
    runAction,
  };
}
```

- [ ] **Step 5: Wire job actions into `App.jsx`**

In `src/App.jsx`, add this import near the existing action imports:

```js
import { createJobActions } from "./actions/jobActions";
```

Create job actions after `workflowActions`:

```js
  const jobActions = createJobActions({
    services: {
      addJobNote,
      runJobAction,
    },
    workspace: {
      setSelectedJob,
      setJobs: setAppJobs,
      setBanner,
    },
    ui: {
      setJobActionBusy,
      setHighlightedChannelNames,
      setJobNoteDraft,
      setAppError,
    },
    getState: () => ({
      selectedJobId,
      jobNoteDraft,
    }),
  });
```

Replace `handleSaveNote()` implementation with:

```js
  const handleSaveNote = jobActions.saveNote;
```

Replace `handleJobAction(action)` implementation with:

```js
  const handleJobAction = jobActions.runAction;
```

Do not change `TaskBoard` props.

- [ ] **Step 6: Run focused tests**

Run:

```bash
node --test tests/src/job-actions.test.mjs
```

Expected: PASS with 7 passing tests.

- [ ] **Step 7: Run related UI workflow test**

Run:

```bash
node --import tsx --test tests/ui/app-workflow.test.jsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add package.json src/App.jsx src/actions/jobActions.js tests/src/job-actions.test.mjs
git commit -m "feat: extract job actions"
```

Expected: commit succeeds.

## Task 2: Extract Artifact Routing

**Files:**
- Create: `src/actions/artifactRouting.js`
- Create: `tests/src/artifact-routing.test.mjs`
- Modify: `src/App.jsx`
- Modify: `package.json`

- [ ] **Step 1: Write failing artifact routing tests**

Create `tests/src/artifact-routing.test.mjs` with exactly:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { openWorkspaceFromJob } from "../../src/actions/artifactRouting.js";

function createRecorder() {
  const calls = [];

  return {
    calls,
    workspace: {
      setSelectedTopic: (value) => calls.push(["topic", value]),
      setCopyPreview: (value) => calls.push(["copy", value]),
      setTone: (value) => calls.push(["tone", value]),
      setAssetMode: (value) => calls.push(["assetMode", value]),
      setBanner: (value) => calls.push(["banner", value]),
    },
    ui: {
      setActiveView: (value) => calls.push(["view", value]),
      setHighlightedChannelNames: (value) => calls.push(["highlighted", value]),
      setBusyAction: (value) => calls.push(["busy", value]),
      setAppError: (value) => calls.push(["error", value]),
    },
  };
}

const currentTopics = [
  {
    id: "topic-1",
    title: "AI 选题",
    summary: "摘要",
    angle: "机会点: 工作流",
  },
];

test("copy draft artifact routes to studio with matched topic payload", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: {
      label: "生成任务",
      scenarioKey: "consumer-tech",
      artifact: {
        type: "copy_draft",
        title: "AI 选题",
        content: "生成内容",
        tone: "小红书种草风",
        assetMode: "图文封面 + 正文排版",
      },
    },
    scenarioKey: "consumer-tech",
    topics: currentTopics,
    services: {
      loadScenarioContext: async () => {
        throw new Error("should not load scenario");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["topic", "AI 选题\n\n摘要\n\n机会点: 工作流"],
    ["copy", "生成内容"],
    ["tone", "小红书种草风"],
    ["assetMode", "图文封面 + 正文排版"],
    ["view", "studio"],
    ["highlighted", []],
    ["banner", "已从任务“生成任务”回到创作舱。"],
    ["busy", ""],
  ]);
});

test("copy draft artifact uses fallback topic text when no topic matches", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: {
      label: "生成任务",
      scenarioKey: "consumer-tech",
      artifact: {
        type: "copy_draft",
        title: "未匹配选题",
      },
    },
    scenarioKey: "consumer-tech",
    topics: currentTopics,
    services: {
      loadScenarioContext: async () => {
        throw new Error("should not load scenario");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["topic", "未匹配选题\n\n来自任务产物预览"],
    ["view", "studio"],
    ["highlighted", []],
    ["banner", "已从任务“生成任务”回到创作舱。"],
    ["busy", ""],
  ]);
});

test("copy draft artifact loads scenario context when job scenario differs", async () => {
  const recorder = createRecorder();
  const loadedTopics = [
    {
      id: "topic-2",
      title: "跨场景选题",
      summary: "跨场景摘要",
      angle: "机会点: 跨场景",
    },
  ];

  await openWorkspaceFromJob({
    selectedJob: {
      label: "跨场景生成",
      scenarioKey: "beauty-skincare",
      artifact: {
        type: "copy_draft",
        title: "跨场景选题",
      },
    },
    scenarioKey: "consumer-tech",
    topics: currentTopics,
    services: {
      loadScenarioContext: async (scenarioKey) => {
        assert.equal(scenarioKey, "beauty-skincare");
        return {
          topics: loadedTopics,
        };
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["topic", "跨场景选题\n\n跨场景摘要\n\n机会点: 跨场景"],
    ["view", "studio"],
    ["highlighted", []],
    ["banner", "已从任务“跨场景生成”回到创作舱。"],
    ["busy", ""],
  ]);
});

test("distribution plan artifact routes to distribution and highlights channels", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: {
      label: "分发任务",
      scenarioKey: "consumer-tech",
      artifact: {
        type: "distribution_plan",
        channels: [{ name: "小红书" }, { name: "视频号" }],
      },
    },
    scenarioKey: "consumer-tech",
    topics: currentTopics,
    services: {
      loadScenarioContext: async () => {
        throw new Error("should not load scenario");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["view", "distribution"],
    ["highlighted", ["小红书", "视频号"]],
    ["banner", "已从任务“分发任务”定位到对应分发排期。"],
    ["busy", ""],
  ]);
});

test("topic refresh artifact routes to discovery and clears highlights", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: {
      label: "选题刷新",
      scenarioKey: "consumer-tech",
      artifact: {
        type: "topic_refresh",
      },
    },
    scenarioKey: "consumer-tech",
    topics: currentTopics,
    services: {
      loadScenarioContext: async () => {
        throw new Error("should not load scenario");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["view", "discovery"],
    ["highlighted", []],
    ["banner", "已从任务“选题刷新”回到选题雷达。"],
    ["busy", ""],
  ]);
});

test("missing selected job is a no-op", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: null,
    scenarioKey: "consumer-tech",
    topics: currentTopics,
    services: {
      loadScenarioContext: async () => {
        throw new Error("should not load scenario");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, []);
});

test("unknown artifact type clears busy state without workspace changes", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: {
      label: "未知任务",
      scenarioKey: "consumer-tech",
      artifact: {
        type: "unknown",
      },
    },
    scenarioKey: "consumer-tech",
    topics: currentTopics,
    services: {
      loadScenarioContext: async () => {
        throw new Error("should not load scenario");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["busy", ""],
  ]);
});

test("scenario loading failures set app error and clear busy state", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: {
      label: "跨场景生成",
      scenarioKey: "beauty-skincare",
      artifact: {
        type: "copy_draft",
        title: "跨场景选题",
      },
    },
    scenarioKey: "consumer-tech",
    topics: currentTopics,
    services: {
      loadScenarioContext: async () => {
        throw new Error("场景加载失败");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["error", "场景加载失败"],
    ["busy", ""],
  ]);
});
```

- [ ] **Step 2: Add artifact routing tests to `npm test`**

In `package.json`, update the first `node --test` command so `tests/src/artifact-routing.test.mjs` appears after `tests/src/runtime-config.test.mjs` and before `tests/src/orchestrator.test.mjs`:

```json
"test": "node --test tests/server/config.test.mjs tests/server/display-url.test.mjs tests/server/domain.test.mjs tests/server/errors.test.mjs tests/server/http.test.mjs tests/server/router.test.mjs tests/server/state-store.test.mjs tests/src/runtime-config.test.mjs tests/src/artifact-routing.test.mjs tests/src/orchestrator.test.mjs tests/src/generation-utils.test.mjs tests/src/job-actions.test.mjs tests/src/workflow-actions.test.mjs tests/src/workspace-state.test.mjs tests/src/workspace-utils.test.mjs tests/src/jobs-utils.test.mjs && node --import tsx --test tests/ui/task-board.test.jsx tests/ui/section-loading.test.jsx tests/ui/workspace-controller.test.jsx tests/ui/error-boundary.test.jsx tests/ui/app-workflow.test.jsx"
```

- [ ] **Step 3: Run failing focused test**

Run:

```bash
node --test tests/src/artifact-routing.test.mjs
```

Expected: FAIL with module-not-found for `src/actions/artifactRouting.js`.

- [ ] **Step 4: Implement `openWorkspaceFromJob()`**

Create `src/actions/artifactRouting.js` with exactly:

```js
import { createTopicPayload } from "../utils/workspace.js";

export async function openWorkspaceFromJob({
  selectedJob,
  scenarioKey,
  topics,
  services,
  workspace,
  ui,
}) {
  if (!selectedJob) {
    return;
  }

  ui.setBusyAction("open-workspace");
  try {
    let scenarioPayload = null;

    if (selectedJob.scenarioKey !== scenarioKey) {
      scenarioPayload = await services.loadScenarioContext(selectedJob.scenarioKey);
    }

    const currentTopics = scenarioPayload?.topics ?? topics;
    const artifact = selectedJob.artifact;

    if (artifact?.type === "copy_draft") {
      const matchTopic = currentTopics.find((item) => item.title === artifact.title);
      workspace.setSelectedTopic(
        matchTopic ? createTopicPayload(matchTopic) : `${artifact.title}\n\n来自任务产物预览`,
      );

      if (artifact.content) {
        workspace.setCopyPreview(artifact.content);
      }
      if (artifact.tone) {
        workspace.setTone(artifact.tone);
      }
      if (artifact.assetMode) {
        workspace.setAssetMode(artifact.assetMode);
      }

      ui.setActiveView("studio");
      ui.setHighlightedChannelNames([]);
      workspace.setBanner(`已从任务“${selectedJob.label}”回到创作舱。`);
      return;
    }

    if (artifact?.type === "distribution_plan") {
      ui.setActiveView("distribution");
      ui.setHighlightedChannelNames(artifact.channels.map((channel) => channel.name));
      workspace.setBanner(`已从任务“${selectedJob.label}”定位到对应分发排期。`);
      return;
    }

    if (artifact?.type === "topic_refresh") {
      ui.setActiveView("discovery");
      ui.setHighlightedChannelNames([]);
      workspace.setBanner(`已从任务“${selectedJob.label}”回到选题雷达。`);
    }
  } catch (error) {
    ui.setAppError(error.message);
  } finally {
    ui.setBusyAction("");
  }
}
```

- [ ] **Step 5: Wire artifact routing into `App.jsx`**

In `src/App.jsx`, add this import:

```js
import { openWorkspaceFromJob } from "./actions/artifactRouting";
```

Replace the body of `handleOpenWorkspaceFromJob()` with:

```js
    await openWorkspaceFromJob({
      selectedJob,
      scenarioKey,
      topics,
      services: {
        loadScenarioContext,
      },
      workspace: {
        setSelectedTopic,
        setCopyPreview,
        setTone,
        setAssetMode,
        setBanner,
      },
      ui: {
        setActiveView,
        setHighlightedChannelNames,
        setBusyAction,
        setAppError,
      },
    });
```

The function should remain:

```js
  async function handleOpenWorkspaceFromJob() {
    await openWorkspaceFromJob({
      selectedJob,
      scenarioKey,
      topics,
      services: {
        loadScenarioContext,
      },
      workspace: {
        setSelectedTopic,
        setCopyPreview,
        setTone,
        setAssetMode,
        setBanner,
      },
      ui: {
        setActiveView,
        setHighlightedChannelNames,
        setBusyAction,
        setAppError,
      },
    });
  }
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
node --test tests/src/artifact-routing.test.mjs
```

Expected: PASS with 8 passing tests.

- [ ] **Step 7: Run related UI workflow test**

Run:

```bash
node --import tsx --test tests/ui/app-workflow.test.jsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add package.json src/App.jsx src/actions/artifactRouting.js tests/src/artifact-routing.test.mjs
git commit -m "feat: extract artifact routing"
```

Expected: commit succeeds.

## Task 3: Expand Orchestrator Contract Tests

**Files:**
- Modify: `tests/src/orchestrator.test.mjs`

- [ ] **Step 1: Add request recorder helper and contract tests**

Append this helper and tests to `tests/src/orchestrator.test.mjs`:

```js
function createRecordingClient() {
  const calls = [];
  const client = createOrchestratorClient({
    config: createRuntimeConfig({
      VITE_API_BASE_URL: "https://api.example.com/",
    }),
    fetchImpl: async (url, options = {}) => {
      calls.push({
        url,
        method: options.method ?? "GET",
        body: options.body ? JSON.parse(options.body) : null,
        headers: options.headers ?? {},
      });
      return createResponse({ ok: true });
    },
  });

  return {
    client,
    calls,
  };
}

test("runWorkflow posts scenario key to workflow endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.runWorkflow("consumer-tech");

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/workflow",
    method: "POST",
    body: { scenarioKey: "consumer-tech" },
    headers: { "Content-Type": "application/json" },
  });
});

test("switchScenario posts scenario key to scenario endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.switchScenario("beauty-skincare");

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/scenario",
    method: "POST",
    body: { scenarioKey: "beauty-skincare" },
    headers: { "Content-Type": "application/json" },
  });
});

test("refreshTopics posts scenario key to topic refresh endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.refreshTopics("education-knowledge");

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/topics/refresh",
    method: "POST",
    body: { scenarioKey: "education-knowledge" },
    headers: { "Content-Type": "application/json" },
  });
});

test("generateDraft posts full generation payload", async () => {
  const { client, calls } = createRecordingClient();
  const payload = {
    tone: "小红书种草风",
    topicId: "topic-1",
    topicText: "AI 选题",
    assetMode: "图文封面 + 正文排版",
    scenarioKey: "consumer-tech",
  };

  await client.generateDraft(payload);

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/generate",
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
  });
});

test("scheduleDistribution posts scenario key to distribution endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.scheduleDistribution({ scenarioKey: "consumer-tech" });

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/distribution/schedule",
    method: "POST",
    body: { scenarioKey: "consumer-tech" },
    headers: { "Content-Type": "application/json" },
  });
});

test("runJobAction posts action and note to job action endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.runJobAction("job-1", "approve", "同意发布");

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/jobs/job-1/action",
    method: "POST",
    body: { action: "approve", note: "同意发布" },
    headers: { "Content-Type": "application/json" },
  });
});

test("addJobNote posts note to job note endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.addJobNote("job-1", "复核封面");

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/jobs/job-1/note",
    method: "POST",
    body: { note: "复核封面" },
    headers: { "Content-Type": "application/json" },
  });
});

test("orchestrator client throws extracted API errors", async () => {
  const client = createOrchestratorClient({
    config: createRuntimeConfig({}),
    fetchImpl: async () => createResponse({ error: "API failed" }, false),
  });

  await assert.rejects(() => client.getJobs(), /API failed/);
});
```

- [ ] **Step 2: Run focused orchestrator tests**

Run:

```bash
node --test tests/src/orchestrator.test.mjs
```

Expected: PASS with existing tests plus 8 new passing tests.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/src/orchestrator.test.mjs
git commit -m "test: expand orchestrator contract coverage"
```

Expected: commit succeeds.

## Task 4: Update Documentation and Verify

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/maintenance-log.md`

- [ ] **Step 1: Update README maintenance paths**

In `README.md`, add these bullets to the current structure section near the existing actions/services entries:

```md
- `src/actions/jobActions.js`: 任务备注保存和任务审核动作
- `src/actions/artifactRouting.js`: 从任务产物回到对应工作区视图的路由逻辑
```

In the common update paths list, replace:

```md
- 调整生成、工作流、刷新、分发等 API 动作：`src/actions/workflowActions.js`
```

with:

```md
- 调整生成、工作流、刷新、分发等 API 动作：`src/actions/workflowActions.js`
- 调整任务备注、审核、重试、取消等动作：`src/actions/jobActions.js`
- 调整任务产物回到工作区的路由：`src/actions/artifactRouting.js`
```

- [ ] **Step 2: Update changelog**

In `CHANGELOG.md`, under the latest `2026-07-05` section, add:

```md
- Added `src/actions/jobActions.js` for task note and review action behavior.
- Added `src/actions/artifactRouting.js` for task artifact-to-workspace routing.
- Added orchestrator contract coverage for request paths, methods, bodies, and error throwing.
```

Under the same section's Changed list, add:

```md
- Refactored `App.jsx` to delegate job mutation and artifact routing behavior to focused action modules.
```

Update the verification test count after running final tests in Step 5.

- [ ] **Step 3: Update maintenance log**

In `docs/maintenance-log.md`, update the path overview rows:

```md
| 应用外壳 | `src/App.jsx` | 已拆出 workspace state、workflow actions、job actions 和 artifact routing | 继续保持布局编排职责，不重新吸收业务动作 |
| 工作流动作 | `src/actions/workflowActions.js`, `src/actions/jobActions.js`, `src/actions/artifactRouting.js` | 已覆盖生成、工作流、刷新、分发、任务备注/动作和产物路由 | 后续加入真实 API 错误分类和 schema contract |
| API 请求层 | `src/services/orchestrator.js`, `src/config/runtimeConfig.js` | 支持 `VITE_API_BASE_URL`，并有请求 contract 测试 | 后续补 schema 或类型契约 |
```

Add a recent update entry:

```md
### 2026-07-05: 内部稳定性收敛

更新内容：

- 新增 `src/actions/jobActions.js`，集中维护任务备注保存和任务审核动作。
- 新增 `src/actions/artifactRouting.js`，集中维护任务产物回到 studio/distribution/discovery 的路由逻辑。
- 扩展 `tests/src/orchestrator.test.mjs`，锁定前端 API 请求路径、方法、请求体和错误抛出行为。
- `App.jsx` 继续收敛为状态装配和页面编排层。

维护影响：

- 后续任务动作调整优先进入 `jobActions`。
- 后续产物路由调整优先进入 `artifactRouting`。
- 接真实 API 前应先更新 orchestrator contract 测试。

验证：

- `npm test`
- `npm run build`
```

- [ ] **Step 4: Run full tests**

Run:

```bash
npm test
```

Expected: PASS. Record the final test count from output.

- [ ] **Step 5: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Update verification counts in docs if needed**

If `npm test` reports a count other than the current `67`, update `CHANGELOG.md` and `docs/maintenance-log.md` to the new count.

- [ ] **Step 7: Commit docs**

Run:

```bash
git add README.md CHANGELOG.md docs/maintenance-log.md
git commit -m "docs: update internal stability paths"
```

Expected: commit succeeds.

## Task 5: Final Verification and Push

**Files:**
- Verify all files changed by Tasks 1-4.

- [ ] **Step 1: Check status**

Run:

```bash
git status --short --branch
```

Expected: `main...origin/main` may be ahead; only unrelated untracked `open-source/` may remain.

- [ ] **Step 2: Run final tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Run final build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Push commits**

Run:

```bash
git push origin main
```

Expected: push succeeds.

- [ ] **Step 5: Confirm CI**

Run:

```bash
gh run list --limit 1
```

Expected: latest CI run for `main` is queued, in progress, or completed.

If in progress, run:

```bash
gh run watch <run-id> --exit-status
```

Expected: CI completes successfully.

## Self-Review

- Spec coverage: job actions are covered by Task 1; artifact routing by Task 2; orchestrator contract coverage by Task 3; documentation updates by Task 4; final verification and push by Task 5.
- Placeholder scan: no unresolved placeholder markers, deferred implementation instructions, or vague "write tests" steps remain.
- Type consistency: `createJobActions()`, `saveNote()`, `runAction()`, and `openWorkspaceFromJob()` signatures are defined before they are wired into `App.jsx`; all setter names match the approved spec.
