import test from "node:test";
import assert from "node:assert/strict";
import {
  applyWorkspacePayloadToState,
  createInitialWorkspaceState,
} from "../../src/state/workspaceState.js";

const defaults = {
  navItems: [{ key: "overview", label: "总览舱" }],
  metrics: [{ label: "默认指标" }],
  scenarios: [
    {
      key: "consumer-tech",
      name: "消费科技",
      command: "执行消费科技工作流",
    },
  ],
  topicsByScenario: {
    "consumer-tech": [
      {
        title: "AI 选题",
        summary: "默认摘要",
        angle: "机会点: 默认",
      },
    ],
  },
  toneNames: ["小红书种草风"],
  assetModes: ["图文封面 + 正文排版"],
  suggestions: {
    overview: "默认建议",
  },
  automationRail: ["默认链路"],
  platformModules: [{ title: "默认模块" }],
  distributionChannels: [{ name: "默认渠道" }],
  securityItems: [{ title: "默认安全项" }],
  timelineSteps: [{ title: "默认时间线" }],
};

test("createInitialWorkspaceState centralizes App workspace defaults", () => {
  const state = createInitialWorkspaceState(defaults);

  assert.equal(state.scenarioKey, "consumer-tech");
  assert.equal(state.scenario.name, "消费科技");
  assert.equal(state.selectedTopic, "AI 选题\n\n默认摘要\n\n机会点: 默认");
  assert.equal(state.tone, "小红书种草风");
  assert.equal(state.assetMode, "图文封面 + 正文排版");
  assert.deepEqual(state.jobs, {
    topicIngestion: [],
    generation: [],
    distribution: [],
  });
});

test("applyWorkspacePayloadToState maps bootstrap payload and preserves fallback app data", () => {
  const current = createInitialWorkspaceState(defaults);
  const next = applyWorkspacePayloadToState(
    current,
    {
      scenario: {
        key: "beauty",
        name: "美妆护肤",
        command: "执行美妆工作流",
      },
      topics: [
        {
          title: "敏感肌选题",
          summary: "后端摘要",
          angle: "机会点: 后端",
        },
      ],
      tones: ["知乎专业评测风"],
      assetModes: ["后端资产模式"],
      initialDraft: "后端草稿",
      commandPreview: "后端命令",
      banner: "后端 banner",
      jobs: {
        topicIngestion: [],
        generation: [{ id: "g1", scenarioKey: "beauty" }],
        distribution: [],
      },
    },
    defaults,
    "覆盖 banner",
  );

  assert.equal(next.scenarioKey, "beauty");
  assert.equal(next.banner, "覆盖 banner");
  assert.equal(next.copyPreview, "后端草稿");
  assert.equal(next.commandPreview, "后端命令");
  assert.equal(next.assetMode, "后端资产模式");
  assert.deepEqual(next.navItems, defaults.navItems);
  assert.deepEqual(next.metrics, defaults.metrics);
  assert.equal(next.selectedJobId, "g1");
});
