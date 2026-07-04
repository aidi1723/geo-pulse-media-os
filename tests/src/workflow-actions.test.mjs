import test from "node:test";
import assert from "node:assert/strict";
import { createWorkflowActions } from "../../src/actions/workflowActions.js";

function createRecorder() {
  const calls = [];

  return {
    calls,
    ui: {
      setBusyAction: (value) => calls.push(["busy", value]),
      setHighlightedChannelNames: (value) => calls.push(["highlighted", value]),
      setAppError: (value) => calls.push(["error", value]),
      setActiveView: (value) => calls.push(["view", value]),
    },
    workspace: {
      setCopyPreview: (value) => calls.push(["copy", value]),
      setBanner: (value) => calls.push(["banner", value]),
      setJobs: (value) => calls.push(["jobs", value]),
      setSelectedJobId: (value) => calls.push(["selectedJob", value]),
      setCommandPreview: (value) => calls.push(["command", value]),
      setTopics: (value) => calls.push(["topics", value]),
    },
  };
}

const jobs = {
  topicIngestion: [{ id: "i1", scenarioKey: "consumer-tech" }],
  generation: [{ id: "g1", scenarioKey: "consumer-tech" }],
  distribution: [{ id: "d1", scenarioKey: "consumer-tech" }],
};

test("generateDraft updates copy preview, jobs, selected job, and clears UI error", async () => {
  const recorder = createRecorder();
  const actions = createWorkflowActions({
    services: {
      generateDraft: async (payload) => {
        assert.equal(payload.topicId, "topic-1");
        assert.equal(payload.tone, "小红书种草风");

        return {
          content: "生成内容",
          status: "生成完成",
          jobs,
          job: { id: "new-generation" },
        };
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      topics: [{ id: "topic-1", title: "AI 选题" }],
      selectedTopic: "AI 选题\n\n摘要\n\n机会点",
      tone: "小红书种草风",
      assetMode: "图文封面 + 正文排版",
      scenarioKey: "consumer-tech",
    }),
  });

  await actions.generateDraft();

  assert.deepEqual(recorder.calls, [
    ["busy", "generate"],
    ["copy", "生成内容"],
    ["banner", "生成完成"],
    ["highlighted", []],
    ["jobs", jobs],
    ["selectedJob", "new-generation"],
    ["error", ""],
    ["busy", ""],
  ]);
});

test("runWorkflow falls back to the relevant job when API does not return focusJobId", async () => {
  const recorder = createRecorder();
  const actions = createWorkflowActions({
    services: {
      runWorkflow: async (scenarioKey) => {
        assert.equal(scenarioKey, "consumer-tech");

        return {
          banner: "命令预览",
          status: "工作流已启动",
          jobs,
        };
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      scenarioKey: "consumer-tech",
    }),
  });

  await actions.runWorkflow();

  assert.deepEqual(recorder.calls, [
    ["busy", "workflow"],
    ["command", "命令预览"],
    ["banner", "工作流已启动"],
    ["highlighted", []],
    ["jobs", jobs],
    ["selectedJob", "g1"],
    ["error", ""],
    ["busy", ""],
  ]);
});

test("refreshTopics updates topics and selects the created ingestion job", async () => {
  const recorder = createRecorder();
  const refreshedTopics = [{ id: "topic-2", title: "刷新选题" }];
  const actions = createWorkflowActions({
    services: {
      refreshTopics: async (scenarioKey) => {
        assert.equal(scenarioKey, "consumer-tech");

        return {
          topics: refreshedTopics,
          banner: "热点已刷新",
          jobs,
          job: { id: "new-ingestion" },
        };
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      scenarioKey: "consumer-tech",
    }),
  });

  await actions.refreshTopics();

  assert.deepEqual(recorder.calls, [
    ["busy", "refresh"],
    ["topics", refreshedTopics],
    ["banner", "热点已刷新"],
    ["highlighted", []],
    ["jobs", jobs],
    ["selectedJob", "new-ingestion"],
    ["error", ""],
    ["busy", ""],
  ]);
});

test("scheduleDistribution opens distribution view and selects created job", async () => {
  const recorder = createRecorder();
  const actions = createWorkflowActions({
    services: {
      scheduleDistribution: async (payload) => {
        assert.deepEqual(payload, { scenarioKey: "consumer-tech" });

        return {
          banner: "分发已创建",
          jobs,
          job: { id: "new-distribution" },
        };
      },
    },
    workspace: recorder.workspace,
    ui: recorder.ui,
    getState: () => ({
      scenarioKey: "consumer-tech",
    }),
  });

  await actions.scheduleDistribution();

  assert.deepEqual(recorder.calls, [
    ["busy", "distribution"],
    ["view", "distribution"],
    ["banner", "分发已创建"],
    ["highlighted", []],
    ["jobs", jobs],
    ["selectedJob", "new-distribution"],
    ["error", ""],
    ["busy", ""],
  ]);
});
