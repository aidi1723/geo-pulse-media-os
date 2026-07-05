import test from "node:test";
import assert from "node:assert/strict";
import { openWorkspaceFromJob } from "../../src/actions/artifactRouting.js";

function createRecorder(overrides = {}) {
  const calls = [];

  return {
    calls,
    services: {
      loadScenarioContext: async (nextKey) => {
        calls.push(["loadScenario", nextKey]);

        return overrides.scenarioPayload ?? { topics: [] };
      },
      ...overrides.services,
    },
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

const baseTopics = [
  {
    title: "AI 手机发布会预热",
    summary: "关注影像和端侧 AI 卖点。",
    angle: "机会点: 参数对比 + 场景体验",
  },
];

test("copy draft routes to studio with matched topic payload", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: {
      label: "文案生成",
      scenarioKey: "consumer-tech",
      artifact: {
        type: "copy_draft",
        title: "AI 手机发布会预热",
        content: "发布会草稿",
        tone: "知乎专业评测风",
        assetMode: "图文封面 + 正文排版",
      },
    },
    scenarioKey: "consumer-tech",
    topics: baseTopics,
    services: recorder.services,
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["topic", "AI 手机发布会预热\n\n关注影像和端侧 AI 卖点。\n\n机会点: 参数对比 + 场景体验"],
    ["copy", "发布会草稿"],
    ["tone", "知乎专业评测风"],
    ["assetMode", "图文封面 + 正文排版"],
    ["view", "studio"],
    ["highlighted", []],
    ["banner", "已从任务“文案生成”回到创作舱。"],
    ["busy", ""],
  ]);
});

test("copy draft uses fallback topic text when no topic matches", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: {
      label: "文案生成",
      scenarioKey: "consumer-tech",
      artifact: {
        type: "copy_draft",
        title: "未匹配选题",
      },
    },
    scenarioKey: "consumer-tech",
    topics: baseTopics,
    services: recorder.services,
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["topic", "未匹配选题\n\n来自任务产物预览"],
    ["view", "studio"],
    ["highlighted", []],
    ["banner", "已从任务“文案生成”回到创作舱。"],
    ["busy", ""],
  ]);
});

test("copy draft loads scenario context when selected job scenario differs", async () => {
  const recorder = createRecorder({
    scenarioPayload: {
      topics: [
        {
          title: "功效护肤成分复盘",
          summary: "用户关注安全性和真实修护周期。",
          angle: "机会点: 成分清单 + 对比图",
        },
      ],
    },
  });

  await openWorkspaceFromJob({
    selectedJob: {
      label: "跨场景文案",
      scenarioKey: "beauty",
      artifact: {
        type: "copy_draft",
        title: "功效护肤成分复盘",
      },
    },
    scenarioKey: "consumer-tech",
    topics: baseTopics,
    services: recorder.services,
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["loadScenario", "beauty"],
    ["topic", "功效护肤成分复盘\n\n用户关注安全性和真实修护周期。\n\n机会点: 成分清单 + 对比图"],
    ["view", "studio"],
    ["highlighted", []],
    ["banner", "已从任务“跨场景文案”回到创作舱。"],
    ["busy", ""],
  ]);
});

test("distribution plan routes to distribution and highlights channel names", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: {
      label: "分发排期",
      scenarioKey: "consumer-tech",
      artifact: {
        type: "distribution_plan",
        channels: [
          { name: "小红书", schedule: "09:30" },
          { name: "视频号", schedule: "18:00" },
        ],
      },
    },
    scenarioKey: "consumer-tech",
    topics: baseTopics,
    services: recorder.services,
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["view", "distribution"],
    ["highlighted", ["小红书", "视频号"]],
    ["banner", "已从任务“分发排期”定位到对应分发排期。"],
    ["busy", ""],
  ]);
});

test("topic refresh routes to discovery and clears highlights", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: {
      label: "热点刷新",
      scenarioKey: "consumer-tech",
      artifact: {
        type: "topic_refresh",
      },
    },
    scenarioKey: "consumer-tech",
    topics: baseTopics,
    services: recorder.services,
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["view", "discovery"],
    ["highlighted", []],
    ["banner", "已从任务“热点刷新”回到选题雷达。"],
    ["busy", ""],
  ]);
});

test("missing selected job is a no-op", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: null,
    scenarioKey: "consumer-tech",
    topics: baseTopics,
    services: recorder.services,
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, []);
});

test("unknown artifact type sets and clears busy and otherwise does not change workspace", async () => {
  const recorder = createRecorder();

  await openWorkspaceFromJob({
    selectedJob: {
      label: "未知产物",
      scenarioKey: "consumer-tech",
      artifact: {
        type: "unknown",
      },
    },
    scenarioKey: "consumer-tech",
    topics: baseTopics,
    services: recorder.services,
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["busy", ""],
  ]);
});

test("scenario loading failure sets app error and clears busy", async () => {
  const recorder = createRecorder({
    services: {
      loadScenarioContext: async (nextKey) => {
        recorder.calls.push(["loadScenario", nextKey]);
        throw new Error("场景加载失败");
      },
    },
  });

  await openWorkspaceFromJob({
    selectedJob: {
      label: "跨场景文案",
      scenarioKey: "beauty",
      artifact: {
        type: "copy_draft",
        title: "功效护肤成分复盘",
      },
    },
    scenarioKey: "consumer-tech",
    topics: baseTopics,
    services: recorder.services,
    workspace: recorder.workspace,
    ui: recorder.ui,
  });

  assert.deepEqual(recorder.calls, [
    ["busy", "open-workspace"],
    ["loadScenario", "beauty"],
    ["error", "场景加载失败"],
    ["busy", ""],
  ]);
});
