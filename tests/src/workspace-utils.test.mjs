import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWorkspaceState,
  createTopicPayload,
  pickRelevantJobId,
} from "../../src/utils/workspace.js";

test("createTopicPayload builds the studio textarea content from a topic", () => {
  assert.equal(
    createTopicPayload({
      title: "敏感肌春夏换季维稳怎么选？",
      summary: "用户对成分安全、肤感和真实修护周期最敏感。",
      angle: "机会点: 维稳清单 + 对比图",
    }),
    "敏感肌春夏换季维稳怎么选？\n\n用户对成分安全、肤感和真实修护周期最敏感。\n\n机会点: 维稳清单 + 对比图",
  );
});

test("pickRelevantJobId prefers jobs from the active scenario", () => {
  const jobs = {
    topicIngestion: [{ id: "i1", scenarioKey: "consumer-tech" }],
    generation: [{ id: "g1", scenarioKey: "beauty" }],
    distribution: [{ id: "d1", scenarioKey: "consumer-tech" }],
  };

  assert.equal(pickRelevantJobId(jobs, "beauty"), "g1");
});

test("buildWorkspaceState resets preview and defaults from bootstrap payload", () => {
  const state = buildWorkspaceState({
    scenario: { key: "beauty", name: "美妆护肤" },
    topics: [
      {
        title: "敏感肌春夏换季维稳怎么选？",
        summary: "用户对成分安全、肤感和真实修护周期最敏感。",
        angle: "机会点: 维稳清单 + 对比图",
      },
    ],
    tones: ["小红书种草风", "知乎专业评测风"],
    assetModes: ["图文封面 + 正文排版", "视频脚本 + 镜头建议"],
    initialDraft: "这是美妆场景的默认草稿",
    commandPreview: "筛出今日最适合转化的护肤热点",
    banner: "行业场景已切换为 美妆护肤",
    suggestion: "先从功效型对比选题切入。",
    jobs: {
      topicIngestion: [{ id: "i1", scenarioKey: "consumer-tech" }],
      generation: [{ id: "g1", scenarioKey: "beauty" }],
      distribution: [],
    },
  });

  assert.equal(state.scenarioKey, "beauty");
  assert.equal(state.tone, "小红书种草风");
  assert.equal(state.assetMode, "图文封面 + 正文排版");
  assert.equal(state.copyPreview, "这是美妆场景的默认草稿");
  assert.match(state.selectedTopic, /敏感肌春夏换季维稳怎么选/);
  assert.equal(state.selectedJobId, "g1");
});

test("buildWorkspaceState stays safe when bootstrap payload has no topics or jobs", () => {
  const state = buildWorkspaceState({
    scenario: { key: "education", name: "教育知识" },
    topics: [],
    tones: [],
    assetModes: [],
    jobs: {
      topicIngestion: [],
      generation: [],
      distribution: [],
    },
  });

  assert.equal(state.selectedTopic, "请输入核心选题\n\n补充你的问题、场景和关键信息\n\n机会点: 先写切入角度");
  assert.equal(state.tone, "");
  assert.equal(state.assetMode, "");
  assert.equal(state.selectedJobId, "");
});
