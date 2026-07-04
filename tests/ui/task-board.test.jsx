import test from "node:test";
import assert from "node:assert/strict";
import React, { useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import TaskBoard from "../../src/components/TaskBoard.jsx";

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

const jobs = {
  topicIngestion: [
    {
      id: "i1",
      scenarioKey: "consumer-tech",
      label: "科技采集",
      detail: "科技采集详情",
      status: "completed",
      createdAt: "2026-04-17T00:30:00.000Z",
    },
    {
      id: "i2",
      scenarioKey: "beauty",
      label: "美妆采集",
      detail: "美妆采集详情",
      status: "completed",
      createdAt: "2026-04-17T00:35:00.000Z",
    },
  ],
  generation: [
    {
      id: "g1",
      scenarioKey: "consumer-tech",
      label: "科技生成",
      detail: "科技生成详情",
      status: "completed",
      createdAt: "2026-04-17T00:40:00.000Z",
    },
  ],
  distribution: [],
};

test("TaskBoard toggles between current-scenario jobs and all jobs", async () => {
  const { dom, container } = setupDom();
  const root = createRoot(container);

  function Harness() {
    const [scope, setScope] = useState("current");

    return (
      <TaskBoard
        jobs={jobs}
        activeScenarioKey="beauty"
        activeScenarioName="美妆护肤"
        taskScope={scope}
        onChangeTaskScope={setScope}
        selectedJobId="i2"
        selectedJob={null}
        busyAction=""
        noteDraft=""
        onSelectJob={() => {}}
        onOpenWorkspace={() => {}}
        onChangeNote={() => {}}
        onAction={() => {}}
        onSaveNote={() => {}}
      />
    );
  }

  await act(async () => {
    root.render(<Harness />);
  });

  assert.match(container.textContent, /美妆采集/);
  assert.doesNotMatch(container.textContent, /科技采集/);

  const allButton = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === "全部任务",
  );

  assert.ok(allButton, "expected 全部任务 button to exist");

  await act(async () => {
    allButton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });

  assert.match(container.textContent, /科技采集/);
  assert.match(container.textContent, /美妆采集/);

  await act(async () => {
    root.unmount();
  });
  cleanupDom(dom);
});

test("TaskBoard disables note and action controls while a job action is busy", async () => {
  const { dom, container } = setupDom();
  const root = createRoot(container);
  const selectedJob = {
    ...jobs.generation[0],
    reviewStatus: "pending_review",
    resultSummary: "等待审核",
    actions: ["approve", "reject", "retry"],
    notes: [],
    history: [],
  };

  await act(async () => {
    root.render(
      <TaskBoard
        jobs={jobs}
        activeScenarioKey="consumer-tech"
        activeScenarioName="消费科技"
        taskScope="current"
        onChangeTaskScope={() => {}}
        selectedJobId="g1"
        selectedJob={selectedJob}
        busyAction="approve"
        noteDraft="审核意见"
        onSelectJob={() => {}}
        onOpenWorkspace={() => {}}
        onChangeNote={() => {}}
        onAction={() => {}}
        onSaveNote={() => {}}
      />,
    );
  });

  const textarea = container.querySelector("#job-note");
  const actionButtons = Array.from(container.querySelectorAll(".job-actions button"));

  assert.equal(textarea.disabled, true);
  assert.ok(actionButtons.length > 0, "expected job action buttons to exist");
  assert.equal(actionButtons.every((button) => button.disabled), true);
  assert.match(container.textContent, /通过中/);

  await act(async () => {
    root.unmount();
  });
  cleanupDom(dom);
});
