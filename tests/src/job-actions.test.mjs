import test from "node:test";
import assert from "node:assert/strict";
import { createJobActions } from "../../src/actions/jobActions.js";

function createRecorder() {
  const calls = [];

  return {
    calls,
    ui: {
      setJobActionBusy: (value) => calls.push(["busy", value]),
      setHighlightedChannelNames: (value) => calls.push(["highlighted", value]),
      setJobNoteDraft: (value) => calls.push(["draft", value]),
      setAppError: (value) => calls.push(["error", value]),
    },
    workspace: {
      setSelectedJob: (value) => calls.push(["selectedJob", value]),
      setJobs: (value) => calls.push(["jobs", value]),
      setBanner: (value) => calls.push(["banner", value]),
    },
  };
}

const result = {
  job: { id: "job-1", label: "任务" },
  jobs: {
    topicIngestion: [],
    generation: [{ id: "job-1" }],
    distribution: [],
  },
  banner: "任务已更新",
};

test("saveNote does nothing when selected job id is empty", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      addJobNote: async () => {
        throw new Error("service should not be called");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "",
      jobNoteDraft: "需要记录",
    }),
  });

  await actions.saveNote();

  assert.deepEqual(recorder.calls, []);
});

test("saveNote does nothing when trimmed note is blank", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      addJobNote: async () => {
        throw new Error("service should not be called");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "job-1",
      jobNoteDraft: "   \n\t ",
    }),
  });

  await actions.saveNote();

  assert.deepEqual(recorder.calls, []);
});

test("saveNote stores trimmed note, updates job state, clears draft and error", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      addJobNote: async (selectedJobId, note) => {
        recorder.calls.push(["addNote", selectedJobId, note]);

        return result;
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "job-1",
      jobNoteDraft: "  复核封面文案  ",
    }),
  });

  await actions.saveNote();

  assert.deepEqual(recorder.calls, [
    ["busy", "note"],
    ["addNote", "job-1", "复核封面文案"],
    ["selectedJob", result.job],
    ["jobs", result.jobs],
    ["banner", result.banner],
    ["draft", ""],
    ["error", ""],
    ["busy", ""],
  ]);
});

test("saveNote sets app error and clears busy on failure", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      addJobNote: async () => {
        recorder.calls.push(["addNote"]);
        throw new Error("保存失败");
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
    ["addNote"],
    ["error", "保存失败"],
    ["busy", ""],
  ]);
});

test("runAction executes action, updates job state, clears highlights, draft, and error", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      runJobAction: async (selectedJobId, action, note) => {
        recorder.calls.push(["runAction", selectedJobId, action, note]);

        return result;
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "job-1",
      jobNoteDraft: "  准备发布  ",
    }),
  });

  await actions.runAction("approve");

  assert.deepEqual(recorder.calls, [
    ["busy", "approve"],
    ["runAction", "job-1", "approve", "准备发布"],
    ["selectedJob", result.job],
    ["jobs", result.jobs],
    ["banner", result.banner],
    ["highlighted", []],
    ["draft", ""],
    ["error", ""],
    ["busy", ""],
  ]);
});

test("runAction does nothing when selected job id is empty", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      runJobAction: async () => {
        throw new Error("service should not be called");
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      selectedJobId: "",
      jobNoteDraft: "备注",
    }),
  });

  await actions.runAction("approve");

  assert.deepEqual(recorder.calls, []);
});

test("runAction sets app error and clears busy on failure", async () => {
  const recorder = createRecorder();
  const actions = createJobActions({
    services: {
      runJobAction: async () => {
        recorder.calls.push(["runAction"]);
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

  await actions.runAction("reject");

  assert.deepEqual(recorder.calls, [
    ["busy", "reject"],
    ["runAction"],
    ["error", "动作失败"],
    ["busy", ""],
  ]);
});
