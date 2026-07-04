import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { useWorkspaceController } from "../../src/hooks/useWorkspaceController.js";

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
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
}

const defaults = {
  navItems: [{ key: "overview", label: "总览舱" }],
  metrics: [],
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
  automationRail: [],
  platformModules: [],
  distributionChannels: [],
  securityItems: [],
  timelineSteps: [],
};

test("useWorkspaceController exposes workspace state and focused mutators", async () => {
  const { dom, container } = setupDom();
  const root = createRoot(container);
  let controller;

  function Harness() {
    controller = useWorkspaceController(defaults);

    return (
      <output>
        {controller.workspace.scenarioKey}|{controller.workspace.selectedTopic}|
        {controller.workspace.banner}
      </output>
    );
  }

  await act(async () => {
    root.render(<Harness />);
  });

  assert.match(container.textContent, /consumer-tech/);
  assert.match(container.textContent, /AI 选题/);

  await act(async () => {
    controller.setSelectedTopic("自定义选题");
  });

  assert.match(container.textContent, /自定义选题/);

  await act(async () => {
    controller.applyWorkspacePayload(
      {
        scenario: {
          key: "consumer-tech",
          name: "消费科技",
          command: "后端命令",
        },
        topics: [
          {
            title: "后端选题",
            summary: "后端摘要",
            angle: "机会点: 后端",
          },
        ],
        tones: ["后端语气"],
        assetModes: ["后端资产"],
        commandPreview: "后端命令",
        initialDraft: "后端草稿",
        jobs: {
          topicIngestion: [],
          generation: [],
          distribution: [],
        },
      },
      "覆盖状态",
    );
  });

  assert.match(container.textContent, /后端选题/);
  assert.match(container.textContent, /覆盖状态/);
  assert.equal(controller.workspace.tone, "后端语气");
  assert.equal(controller.workspace.assetMode, "后端资产");

  await act(async () => {
    root.unmount();
  });
  cleanupDom(dom);
});
