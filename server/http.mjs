export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export function toErrorResponse(error, fallbackStatusCode = 500) {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message },
    };
  }

  return {
    statusCode: fallbackStatusCode,
    body: {
      error: error instanceof Error ? error.message : "Unknown error",
    },
  };
}

function getLogPath(request) {
  try {
    return new URL(request.url ?? "/", "http://localhost").pathname;
  } catch {
    return (request.url ?? "/").split(/[?#]/, 1)[0] || "/";
  }
}

export function withRequestLogging(handler, { logger = console, now = Date.now } = {}) {
  return async function loggedHandler(request, response, ...args) {
    const startedAt = now();

    try {
      await handler(request, response, ...args);
    } finally {
      const durationMs = Math.max(0, now() - startedAt);
      const method = request.method ?? "UNKNOWN";
      const path = getLogPath(request);
      const statusCode = response.statusCode || 500;

      try {
        logger.info(`${method} ${path} ${statusCode} ${durationMs}ms`);
      } catch {
        // Logging is best-effort and must not affect request handling.
      }
    }
  };
}

export function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(payload));
}

export function sendError(response, errorOrStatusCode, message) {
  if (typeof errorOrStatusCode === "number") {
    sendJson(response, errorOrStatusCode, { error: message ?? "Unknown error" });
    return;
  }

  const { statusCode, body } = toErrorResponse(errorOrStatusCode);
  sendJson(response, statusCode, body);
}

export async function readBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}
