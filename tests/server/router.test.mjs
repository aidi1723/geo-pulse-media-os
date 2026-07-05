import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";

async function loadHandleRequest(env = {}) {
  const previousEnv = {
    GEO_PULSE_API_HOST: process.env.GEO_PULSE_API_HOST,
    GEO_PULSE_API_PORT: process.env.GEO_PULSE_API_PORT,
  };

  Object.assign(process.env, env);

  try {
    const module = await import(`../../server/router.mjs?case=${Date.now()}-${Math.random()}`);
    return module.handleRequest;
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function createRequest({ method = "GET", url = "/", body } = {}) {
  const request = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
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

async function dispatch(options) {
  const request = createRequest(options);
  const response = createResponse();
  const handleRequest = await loadHandleRequest(options?.env);

  await handleRequest(request, response);

  return {
    statusCode: response.statusCode,
    body: response.payload ? JSON.parse(response.payload) : null,
  };
}

test("router parses relative URLs independently of the API bind host", async () => {
  const response = await dispatch({
    method: "GET",
    url: "/api/health",
    env: {
      GEO_PULSE_API_HOST: "::1",
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "ok");
});

test("health endpoint returns production metadata", async () => {
  const response = await dispatch({
    method: "GET",
    url: "/api/health",
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.service, "geo-pulse-api");
  assert.equal(response.body.version, "0.1.0");
  assert.equal(response.body.state, "ready");
  assert.match(response.body.date, /^\d{4}-\d{2}-\d{2}T/);
});

test("readiness endpoint confirms state storage is readable", async () => {
  const response = await dispatch({
    method: "GET",
    url: "/api/readiness",
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "ready");
  assert.equal(response.body.service, "geo-pulse-api");
  assert.equal(response.body.state.readable, true);
  assert.match(response.body.date, /^\d{4}-\d{2}-\d{2}T/);
});

test("readiness endpoint reports state storage failures", async () => {
  const request = createRequest({
    method: "GET",
    url: "/api/readiness",
  });
  const response = createResponse();
  const handleRequest = await loadHandleRequest();

  await handleRequest(request, response, {
    stateStore: {
      async checkReadiness() {
        throw new Error("invalid state json");
      },
    },
  });

  const body = JSON.parse(response.payload);

  assert.equal(response.statusCode, 503);
  assert.equal(body.status, "not_ready");
  assert.equal(body.service, "geo-pulse-api");
  assert.equal(body.state.readable, false);
  assert.equal(body.state.error, "invalid state json");
});

test("bootstrap rejects unknown scenario keys", async () => {
  const response = await dispatch({
    method: "GET",
    url: "/api/bootstrap?scenario=unknown-scenario",
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /Unknown scenario/);
});

test("job note endpoint rejects blank notes", async () => {
  const response = await dispatch({
    method: "POST",
    url: "/api/jobs/seed-generation-01/note",
    body: {
      note: "   ",
    },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "备注不能为空");
});

test("job note endpoint rejects non-string notes", async () => {
  const response = await dispatch({
    method: "POST",
    url: "/api/jobs/seed-generation-01/note",
    body: {
      note: 42,
    },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "备注必须是文本");
});

test("generate endpoint rejects non-string topic text", async () => {
  const response = await dispatch({
    method: "POST",
    url: "/api/generate",
    body: {
      scenarioKey: "consumer-tech",
      topicText: 42,
      tone: "小红书种草风",
      assetMode: "图文封面 + 正文排版",
    },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "选题内容必须是文本");
});
