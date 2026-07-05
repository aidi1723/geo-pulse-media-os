import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { sendJson, withRequestLogging } from "../../server/http.mjs";

function createRequest({ method = "GET", url = "/api/health" } = {}) {
  const request = Readable.from([]);
  request.method = method;
  request.url = url;
  return request;
}

function createResponse() {
  return {
    statusCode: 0,
    headers: {},
    payload: "",
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(chunk = "") {
      this.payload = chunk.toString();
    },
  };
}

test("sendJson stores status code for request logging", () => {
  const response = createResponse();

  sendJson(response, 201, { ok: true });

  assert.equal(response.statusCode, 201);
  assert.equal(JSON.parse(response.payload).ok, true);
});

test("withRequestLogging logs method, path, status, and duration without body", async () => {
  const logs = [];
  const handler = withRequestLogging(
    async (request, response) => {
      sendJson(response, 202, { ok: true });
    },
    {
      logger: {
        info: (message) => logs.push(message),
      },
      now: (() => {
        const values = [100, 137];
        return () => values.shift();
      })(),
    },
  );

  await handler(createRequest({ method: "POST", url: "/api/workflow?token=secret" }), createResponse());

  assert.equal(logs.length, 1);
  assert.match(logs[0], /POST \/api\/workflow 202 37ms/);
  assert.doesNotMatch(logs[0], /token/);
  assert.doesNotMatch(logs[0], /secret/);
});

test("withRequestLogging ignores logger failures after successful handler calls", async () => {
  const handler = withRequestLogging(
    async (request, response) => {
      sendJson(response, 204, { ok: true });
    },
    {
      logger: {
        info: () => {
          throw new Error("logger unavailable");
        },
      },
    },
  );

  await assert.doesNotReject(handler(createRequest(), createResponse()));
});

test("withRequestLogging preserves handler failures when logger also fails", async () => {
  const handlerError = new Error("handler failed");
  const handler = withRequestLogging(
    async () => {
      throw handlerError;
    },
    {
      logger: {
        info: () => {
          throw new Error("logger unavailable");
        },
      },
    },
  );

  await assert.rejects(handler(createRequest(), createResponse()), handlerError);
});

test("withRequestLogging forwards extra handler arguments", async () => {
  const context = { traceId: "trace-1" };
  let receivedContext;
  const handler = withRequestLogging(
    async (request, response, extra) => {
      receivedContext = extra;
      sendJson(response, 200, { ok: true });
    },
    {
      logger: {
        info: () => {},
      },
    },
  );

  await handler(createRequest(), createResponse(), context);

  assert.equal(receivedContext, context);
});

test("withRequestLogging fallback path omits query-like sensitive text", async () => {
  const logs = [];
  const handler = withRequestLogging(
    async (request, response) => {
      sendJson(response, 200, { ok: true });
    },
    {
      logger: {
        info: (message) => logs.push(message),
      },
      now: (() => {
        const values = [50, 55];
        return () => values.shift();
      })(),
    },
  );

  await handler(createRequest({ url: "http://[::1?token=secret" }), createResponse());

  assert.equal(logs.length, 1);
  assert.match(logs[0], /GET http:\/\/\[::1 200 5ms/);
  assert.doesNotMatch(logs[0], /token/);
  assert.doesNotMatch(logs[0], /secret/);
});
