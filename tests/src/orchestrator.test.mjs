import test from "node:test";
import assert from "node:assert/strict";
import { createRuntimeConfig } from "../../src/config/runtimeConfig.js";
import { createOrchestratorClient, getBootstrapData } from "../../src/services/orchestrator.js";

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

function createRecordingClient() {
  const calls = [];
  const client = createOrchestratorClient({
    config: createRuntimeConfig({
      VITE_API_BASE_URL: "https://api.example.com/",
    }),
    fetchImpl: async (url, options = {}) => {
      calls.push({
        url,
        method: options.method ?? "GET",
        body: options.body ? JSON.parse(options.body) : null,
        headers: options.headers ?? {},
      });
      return createResponse({ ok: true });
    },
  });

  return { client, calls };
}

test("createOrchestratorClient prefixes requests with configured API base URL", async () => {
  const calls = [];
  const client = createOrchestratorClient({
    config: createRuntimeConfig({
      VITE_API_BASE_URL: "https://api.example.com/",
    }),
    fetchImpl: async (url, options) => {
      calls.push([url, options]);
      return createResponse({ ok: true });
    },
  });

  const payload = await client.getJobs();

  assert.deepEqual(payload, { ok: true });
  assert.equal(calls[0][0], "https://api.example.com/api/jobs");
  assert.equal(calls[0][1].headers["Content-Type"], "application/json");
});

test("createOrchestratorClient keeps relative requests when base URL is empty", async () => {
  const calls = [];
  const client = createOrchestratorClient({
    config: createRuntimeConfig({}),
    fetchImpl: async (url) => {
      calls.push(url);
      return createResponse({ scenario: { key: "consumer-tech" } });
    },
  });

  await client.getBootstrapData("consumer-tech");

  assert.equal(calls[0], "/api/bootstrap?scenario=consumer-tech");
});

test("runWorkflow posts scenario key to workflow endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.runWorkflow("consumer-tech");

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/workflow",
    method: "POST",
    body: { scenarioKey: "consumer-tech" },
    headers: { "Content-Type": "application/json" },
  });
});

test("switchScenario posts scenario key to scenario endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.switchScenario("beauty-skincare");

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/scenario",
    method: "POST",
    body: { scenarioKey: "beauty-skincare" },
    headers: { "Content-Type": "application/json" },
  });
});

test("refreshTopics posts scenario key to topic refresh endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.refreshTopics("education-knowledge");

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/topics/refresh",
    method: "POST",
    body: { scenarioKey: "education-knowledge" },
    headers: { "Content-Type": "application/json" },
  });
});

test("generateDraft posts full generation payload", async () => {
  const { client, calls } = createRecordingClient();
  const payload = {
    tone: "小红书种草风",
    topicId: "topic-1",
    topicText: "AI 选题",
    assetMode: "图文封面 + 正文排版",
    scenarioKey: "consumer-tech",
  };

  await client.generateDraft(payload);

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/generate",
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
  });
});

test("scheduleDistribution posts scenario key to distribution endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.scheduleDistribution({ scenarioKey: "consumer-tech" });

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/distribution/schedule",
    method: "POST",
    body: { scenarioKey: "consumer-tech" },
    headers: { "Content-Type": "application/json" },
  });
});

test("runJobAction posts action and note to job action endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.runJobAction("job-1", "approve", "同意发布");

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/jobs/job-1/action",
    method: "POST",
    body: { action: "approve", note: "同意发布" },
    headers: { "Content-Type": "application/json" },
  });
});

test("addJobNote posts note to job note endpoint", async () => {
  const { client, calls } = createRecordingClient();

  await client.addJobNote("job-1", "复核封面");

  assert.deepEqual(calls[0], {
    url: "https://api.example.com/api/jobs/job-1/note",
    method: "POST",
    body: { note: "复核封面" },
    headers: { "Content-Type": "application/json" },
  });
});

test("orchestrator client throws extracted API errors from failed responses", async () => {
  const client = createOrchestratorClient({
    config: createRuntimeConfig({}),
    fetchImpl: async () => createResponse({ error: "API failed" }, false),
  });

  await assert.rejects(() => client.getJobs(), /API failed/);
});

test("default orchestrator exports keep existing public signatures", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url) => {
    calls.push(url);
    return createResponse({ scenario: { key: "consumer-tech" } });
  };

  try {
    await getBootstrapData("consumer-tech");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls[0], "/api/bootstrap?scenario=consumer-tech");
});
