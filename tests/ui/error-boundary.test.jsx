import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import ErrorBoundary from "../../src/components/ErrorBoundary.jsx";

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

function BrokenComponent() {
  throw new Error("render failure");
}

test("ErrorBoundary renders a production fallback for render failures", async () => {
  const { dom, container } = setupDom();
  const root = createRoot(container);
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await act(async () => {
      root.render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>,
      );
    });

    assert.match(container.textContent, /工作台暂时无法渲染/);
    assert.match(container.textContent, /请刷新页面或查看运行日志/);
  } finally {
    console.error = originalConsoleError;
    await act(async () => {
      root.unmount();
    });
    cleanupDom(dom);
  }
});
