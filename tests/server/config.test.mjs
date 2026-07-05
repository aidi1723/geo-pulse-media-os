import test from "node:test";
import assert from "node:assert/strict";

async function loadConfig(env = {}) {
  const previousEnv = {
    GEO_PULSE_API_HOST: process.env.GEO_PULSE_API_HOST,
    GEO_PULSE_API_PORT: process.env.GEO_PULSE_API_PORT,
    GEO_PULSE_STATE_FILE: process.env.GEO_PULSE_STATE_FILE,
  };

  delete process.env.GEO_PULSE_API_HOST;
  delete process.env.GEO_PULSE_API_PORT;
  delete process.env.GEO_PULSE_STATE_FILE;
  Object.assign(process.env, env);

  try {
    return await import(`../../server/config.mjs?case=${Date.now()}-${Math.random()}`);
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

test("server config keeps local defaults", async () => {
  const config = await loadConfig();

  assert.equal(config.HOST, "127.0.0.1");
  assert.equal(config.PORT, 8787);
  assert.match(config.STATE_FILE, /server\/data\/state\.json$/);
});

test("server config reads environment overrides", async () => {
  const config = await loadConfig({
    GEO_PULSE_API_HOST: "0.0.0.0",
    GEO_PULSE_API_PORT: "9876",
    GEO_PULSE_STATE_FILE: "/tmp/geo-pulse-state.json",
  });

  assert.equal(config.HOST, "0.0.0.0");
  assert.equal(config.PORT, 9876);
  assert.equal(config.STATE_FILE, "/tmp/geo-pulse-state.json");
});

test("server config rejects invalid port values", async () => {
  await assert.rejects(
    () =>
      loadConfig({
        GEO_PULSE_API_PORT: "not-a-port",
      }),
    /GEO_PULSE_API_PORT must be an integer between 1 and 65535/,
  );
});
