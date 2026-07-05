import test from "node:test";
import assert from "node:assert/strict";
import {
  buildApiUrl,
  createRuntimeConfig,
  normalizeApiBaseUrl,
} from "../../src/config/runtimeConfig.js";

test("runtime config defaults to relative API requests", () => {
  const config = createRuntimeConfig({});

  assert.deepEqual(config, {
    apiBaseUrl: "",
  });
  assert.equal(buildApiUrl("/api/health", config), "/api/health");
});

test("runtime config trims trailing slashes from API base URL", () => {
  assert.equal(normalizeApiBaseUrl("https://api.example.com///"), "https://api.example.com");
});

test("buildApiUrl joins configured base URL with an API path", () => {
  const config = createRuntimeConfig({
    VITE_API_BASE_URL: "https://api.example.com/",
  });

  assert.equal(buildApiUrl("/api/bootstrap?scenario=consumer-tech", config), "https://api.example.com/api/bootstrap?scenario=consumer-tech");
});

test("buildApiUrl accepts paths without a leading slash", () => {
  const config = createRuntimeConfig({
    VITE_API_BASE_URL: "https://api.example.com",
  });

  assert.equal(buildApiUrl("api/jobs", config), "https://api.example.com/api/jobs");
});
