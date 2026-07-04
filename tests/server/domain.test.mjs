import test from "node:test";
import assert from "node:assert/strict";
import * as domain from "../../server/domain.mjs";

test("buildDraft uses the selected topic instead of fixed hardware copy", () => {
  const draft = domain.buildDraft({
    scenarioKey: "beauty",
    tone: "小红书种草风",
    topic: {
      title: "敏感肌春夏换季维稳怎么选？",
      summary: "用户对成分安全、肤感和真实修护周期最敏感。",
      angle: "机会点: 维稳清单 + 对比图",
    },
    topicText: "敏感肌春夏换季维稳怎么选？",
    assetMode: "图文封面 + 正文排版",
  });

  assert.match(draft.content, /敏感肌春夏换季维稳怎么选/);
  assert.doesNotMatch(draft.content, /AI 硬件这波真的别盲冲/);
});

test("workflow execution creates ingestion, generation, and distribution follow-up jobs", () => {
  const state = domain.createInitialState();
  const bundle = domain.createWorkflowBundle?.(state, "consumer-tech");

  assert.ok(bundle, "createWorkflowBundle should return a workflow bundle");
  assert.equal(bundle.jobs.topicIngestion[0].label, "工作流已启动");
  assert.equal(bundle.jobs.generation[0].kind, "generation");
  assert.equal(bundle.jobs.distribution[0].kind, "distribution");
  assert.ok(bundle.focusJobId);
});

test("createInitialState returns deterministic seed job ids for demo resets", () => {
  const state = domain.createInitialState();

  assert.equal(state.jobs.topicIngestion[0].id, "seed-ingestion-01");
  assert.equal(state.jobs.generation[0].id, "seed-generation-01");
  assert.equal(state.jobs.distribution[0].id, "seed-distribution-01");
});

test("createInitialState uses seed timestamps that are not in the future", () => {
  const state = domain.createInitialState();
  const now = Date.now();

  assert.ok(new Date(state.jobs.topicIngestion[0].createdAt).getTime() <= now);
  assert.ok(new Date(state.jobs.generation[0].createdAt).getTime() <= now);
  assert.ok(new Date(state.jobs.distribution[0].createdAt).getTime() <= now);
});

test("ensureGenerationInput rejects requests that have neither a topic nor usable text", () => {
  assert.throws(
    () => domain.ensureGenerationInput({ topic: null, topicText: "   " }),
    /请先输入核心选题/,
  );
});

test("ensureGenerationInput rejects non-string topic text", () => {
  assert.throws(
    () => domain.ensureGenerationInput({ topic: null, topicText: 42 }),
    /选题内容必须是文本/,
  );
});

test("getScenarioByKey rejects unknown scenario keys when strict lookup is requested", () => {
  assert.throws(
    () => domain.getScenarioByKey("unknown-scenario", { strict: true }),
    /Unknown scenario/,
  );
});

test("addJobNote rejects blank notes", () => {
  const state = domain.createInitialState();

  assert.throws(
    () => domain.addJobNote(state, "seed-generation-01", "   "),
    /备注不能为空/,
  );
});

test("addJobNote rejects non-string notes", () => {
  const state = domain.createInitialState();

  assert.throws(
    () => domain.addJobNote(state, "seed-generation-01", 42),
    /备注必须是文本/,
  );
});
