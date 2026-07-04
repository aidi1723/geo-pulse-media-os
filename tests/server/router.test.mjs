import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { handleRequest } from "../../server/router.mjs";

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

  await handleRequest(request, response);

  return {
    statusCode: response.statusCode,
    body: response.payload ? JSON.parse(response.payload) : null,
  };
}

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
