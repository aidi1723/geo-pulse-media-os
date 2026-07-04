import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import DiscoverySection from "../../src/sections/DiscoverySection.jsx";
import DistributionSection from "../../src/sections/DistributionSection.jsx";
import StudioSection from "../../src/sections/StudioSection.jsx";

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

test("primary section actions are disabled while loading", async () => {
  const { dom, container } = setupDom();
  const root = createRoot(container);

  const cases = [
    {
      label: "刷新中...",
      element: (
        <DiscoverySection
          topics={[]}
          onSelectTopic={() => {}}
          onRefresh={() => {}}
          isLoading={true}
        />
      ),
    },
    {
      label: "生成中...",
      element: (
        <StudioSection
          selectedTopic="选题"
          setSelectedTopic={() => {}}
          tone="小红书种草风"
          setTone={() => {}}
          tones={["小红书种草风"]}
          assetMode="图文封面 + 正文排版"
          setAssetMode={() => {}}
          copyPreview="预览"
          onGenerate={() => {}}
          isLoading={true}
        />
      ),
    },
    {
      label: "创建中...",
      element: (
        <DistributionSection
          channels={[]}
          highlightedChannelNames={[]}
          onSchedule={() => {}}
          isLoading={true}
        />
      ),
    },
  ];

  for (const item of cases) {
    await act(async () => {
      root.render(item.element);
    });

    const button = Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent === item.label,
    );

    assert.ok(button, `expected ${item.label} button to exist`);
    assert.equal(button.disabled, true, `expected ${item.label} button to be disabled`);
  }

  await act(async () => {
    root.unmount();
  });
  cleanupDom(dom);
});

test("StudioSection renders asset modes from props instead of static mock data", async () => {
  const { dom, container } = setupDom();
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <StudioSection
        selectedTopic="选题"
        setSelectedTopic={() => {}}
        tone="自定义语气"
        setTone={() => {}}
        tones={["自定义语气"]}
        assetMode="后端资产模式"
        assetModes={["后端资产模式"]}
        setAssetMode={() => {}}
        copyPreview="预览"
        onGenerate={() => {}}
        isLoading={false}
      />,
    );
  });

  const assetSelect = container.querySelector("#asset-select");
  const optionLabels = Array.from(assetSelect.querySelectorAll("option")).map(
    (option) => option.textContent,
  );

  assert.deepEqual(optionLabels, ["后端资产模式"]);

  await act(async () => {
    root.unmount();
  });
  cleanupDom(dom);
});
