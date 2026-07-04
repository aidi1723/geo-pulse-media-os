import test from "node:test";
import assert from "node:assert/strict";
import { prepareGenerationPayload } from "../../src/utils/generation.js";

const topics = [
  {
    id: "t1",
    title: "AI 硬件是不是新一轮内容创业的流量入口？",
    summary: "搜索热度持续攀升，用户在找真实体验。",
    angle: "机会点: 测评 + 场景清单",
  },
  {
    id: "t2",
    title: "2026 年个人品牌还需要做公众号吗？",
    summary: "讨论集中在私域沉淀和平台依赖风险。",
    angle: "机会点: 观点型长文",
  },
];

test("prepareGenerationPayload keeps listed topic ids when the selected topic matches", () => {
  const payload = prepareGenerationPayload({
    topics,
    selectedTopic:
      "2026 年个人品牌还需要做公众号吗？\n\n讨论集中在私域沉淀和平台依赖风险。\n\n机会点: 观点型长文",
    tone: "知乎专业评测风",
    assetMode: "图文封面 + 正文排版",
    scenarioKey: "consumer-tech",
  });

  assert.equal(payload.topicId, "t2");
  assert.equal(payload.topicText.includes("2026 年个人品牌还需要做公众号吗？"), true);
});

test("prepareGenerationPayload preserves custom topic text instead of falling back to the first topic", () => {
  const payload = prepareGenerationPayload({
    topics,
    selectedTopic: "自定义新选题\n\n这是运营临时补充的方向\n\n机会点: 新增活动节点",
    tone: "小红书种草风",
    assetMode: "图文封面 + 正文排版",
    scenarioKey: "beauty",
  });

  assert.equal(payload.topicId, undefined);
  assert.match(payload.topicText, /自定义新选题/);
  assert.doesNotMatch(payload.topicText, /AI 硬件是不是新一轮内容创业的流量入口/);
});

test("prepareGenerationPayload matches topics by the title block instead of any substring", () => {
  const payload = prepareGenerationPayload({
    topics,
    selectedTopic:
      "自定义复盘专题\n\n我们会引用 AI 硬件是不是新一轮内容创业的流量入口？ 作为案例\n\n机会点: 二次拆解",
    tone: "小红书种草风",
    assetMode: "图文封面 + 正文排版",
    scenarioKey: "consumer-tech",
  });

  assert.equal(payload.topicId, undefined);
  assert.match(payload.topicText, /自定义复盘专题/);
});

test("prepareGenerationPayload rejects blank topic input", () => {
  assert.throws(
    () =>
      prepareGenerationPayload({
        topics,
        selectedTopic: "   \n\n ",
        tone: "小红书种草风",
        assetMode: "图文封面 + 正文排版",
        scenarioKey: "beauty",
      }),
    /请先输入核心选题/,
  );
});
