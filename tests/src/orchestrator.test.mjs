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
