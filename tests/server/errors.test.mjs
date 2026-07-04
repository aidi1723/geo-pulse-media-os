import test from "node:test";
import assert from "node:assert/strict";
import * as httpModule from "../../server/http.mjs";
import * as orchestrator from "../../src/services/orchestrator.js";

test("toErrorResponse maps application errors to status and message payloads", () => {
  const payload = httpModule.toErrorResponse?.(new Error("Action not allowed"), 409);

  assert.deepEqual(payload, {
    statusCode: 409,
    body: { error: "Action not allowed" },
  });
});

test("extractErrorMessage prefers JSON error bodies", async () => {
  const response = new Response(JSON.stringify({ error: "Job not found" }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const message = await orchestrator.extractErrorMessage?.(response);
  assert.equal(message, "Job not found");
});

test("extractErrorMessage falls back cleanly when json has no error fields", async () => {
  const response = new Response(JSON.stringify({ detail: "unexpected" }), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const message = await orchestrator.extractErrorMessage?.(response);
  assert.equal(message, "Request failed: 500");
});
