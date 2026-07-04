import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import App from "../../src/App.jsx";

function setupDom() {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost",
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });

  return {
    dom,
    container: dom.window.document.getElementById("root"),
  };
}

function cleanupDom(dom) {
  dom.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.HTMLElement;
  delete globalThis.Node;
  delete globalThis.navigator;
  delete globalThis.fetch;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
}

function createResponse(payload, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    headers: {
      get: () => "application/json",
    },
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    },
  };
}

const jobs = {
  topicIngestion: [
    {
      id: "workflow-1",
      scenarioKey: "consumer-tech",
      kind: "workflow",
      status: "queued",
      reviewStatus: "not_required",
      label: "工作流已启动",
      detail: "消费科技 场景已创建任务",
      createdAt: "2026-04-17T00:30:00.000Z",
      resultSummary: "系统已创建后续任务。",
      actions: ["retry", "cancel"],
      notes: [],
      history: [],
      payload: {},
      artifact: {
        type: "generic",
        title: "工作流已启动",
        summary: "系统已创建后续任务。",
      },
    },
  ],
  generation: [
    {
      id: "generation-1",
      scenarioKey: "consumer-tech",
      kind: "generation",
      status: "completed",
      reviewStatus: "pending_review",
      label: "生成任务完成",
      detail: "小红书种草风 / 图文封面 + 正文排版 / AI 选题",
      createdAt: "2026-04-17T00:40:00.000Z",
      completedAt: "2026-04-17T00:45:00.000Z",
      resultSummary: "草稿已生成。",
      actions: ["retry", "approve", "reject"],
      notes: [],
      history: [],
      payload: {},
      artifact: {
        type: "copy_draft",
        title: "AI 选题",
        tone: "小红书种草风",
        assetMode: "图文封面 + 正文排版",
        content: "测试草稿",
      },
    },
  ],
  distribution: [],
};

const bootstrapPayload = {
  navItems: [
    { key: "overview", label: "总览舱", caption: "全局状态" },
    { key: "studio", label: "创作舱", caption: "内容生成" },
  ],
  metrics: [],
  scenarios: [
    {
      key: "consumer-tech",
      name: "消费科技",
      command: "执行消费科技工作流",
      heroTitle: "消费科技内容矩阵",
      heroBody: "围绕消费科技选题完成自动化运营。",
      strategyTitle: "策略建议",
      strategyBody: "优先处理高意图选题。",
      distributionBody: "午间发布。",
    },
  ],
  scenario: {
    key: "consumer-tech",
    name: "消费科技",
    command: "执行消费科技工作流",
    heroTitle: "消费科技内容矩阵",
    heroBody: "围绕消费科技选题完成自动化运营。",
    strategyTitle: "策略建议",
    strategyBody: "优先处理高意图选题。",
    distributionBody: "午间发布。",
  },
  topics: [
    {
      id: "topic-1",
      source: "小红书",
      heat: "热度 95",
      title: "AI 选题",
      summary: "AI 内容工具升温。",
      angle: "机会点: 工作流",
      tags: ["AI"],
    },
  ],
  tones: ["小红书种草风"],
  assetModes: ["图文封面 + 正文排版"],
  timelineSteps: [],
  distributionChannels: [],
  securityItems: [],
  automationRail: [],
  platformModules: [],
  suggestion: "继续审核生成稿。",
  commandPreview: "执行消费科技工作流",
  banner: "本地 API 已连接。",
  initialDraft: "初始草稿",
  jobs,
};

test("App falls back to a relevant workflow job when focusJobId is missing", async () => {
  const { dom, container } = setupDom();
  const root = createRoot(container);

  globalThis.fetch = async (path) => {
    if (path === "/api/bootstrap?scenario=consumer-tech") {
      return createResponse(bootstrapPayload);
    }

    if (path === "/api/workflow") {
      return createResponse({
        status: "工作流已执行。",
        banner: "工作流已拆分为后续任务。",
        jobs,
      });
    }

    if (path === "/api/jobs/generation-1") {
      return createResponse(jobs.generation[0]);
    }

    if (path === "/api/jobs/workflow-1") {
      return createResponse(jobs.topicIngestion[0]);
    }

    return createResponse({ error: `Unexpected path: ${path}` }, false);
  };

  await act(async () => {
    root.render(<App />);
  });

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const workflowButton = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === "执行今日工作流",
  );
  assert.ok(workflowButton, "expected workflow button to exist");

  await act(async () => {
    workflowButton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });

  assert.doesNotMatch(container.textContent, /pickRelevantJobId is not defined/);
  assert.match(container.textContent, /生成任务完成/);

  await act(async () => {
    root.unmount();
  });
  cleanupDom(dom);
});

test("App disables global workflow controls while workflow request is pending", async () => {
  const { dom, container } = setupDom();
  const root = createRoot(container);
  let resolveWorkflow;

  globalThis.fetch = async (path) => {
    if (path === "/api/bootstrap?scenario=consumer-tech") {
      return createResponse(bootstrapPayload);
    }

    if (path === "/api/workflow") {
      await new Promise((resolve) => {
        resolveWorkflow = resolve;
      });
      return createResponse({
        status: "工作流已执行。",
        banner: "工作流已拆分为后续任务。",
        jobs,
      });
    }

    if (path === "/api/jobs/generation-1") {
      return createResponse(jobs.generation[0]);
    }

    return createResponse({ error: `Unexpected path: ${path}` }, false);
  };

  await act(async () => {
    root.render(<App />);
  });

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const workflowButton = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === "执行今日工作流",
  );
  const scenarioSelect = container.querySelector("#scenario-switch");

  assert.ok(workflowButton, "expected workflow button to exist");
  assert.ok(scenarioSelect, "expected scenario select to exist");

  await act(async () => {
    workflowButton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  assert.equal(workflowButton.disabled, true);
  assert.equal(scenarioSelect.disabled, true);
  assert.equal(workflowButton.textContent, "执行中...");

  resolveWorkflow();

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  await act(async () => {
    root.unmount();
  });
  cleanupDom(dom);
});
