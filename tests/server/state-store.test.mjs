import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInitialState } from "../../server/domain.mjs";
import { createStateStore } from "../../server/state-store.mjs";

test("updateState persists an explicit nextState returned by the mutator", async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), "geo-pulse-state-store-"));
  const stateFile = path.join(tempDir, "state.json");
  const store = createStateStore(stateFile);
  const seed = createInitialState();

  try {
    await writeFile(stateFile, JSON.stringify(seed, null, 2), "utf8");

    const nextState = {
      ...seed,
      version: 2,
      updatedAt: "2026-04-18T00:00:00.000Z",
    };
    const result = await store.updateState(() => ({
      nextState,
      response: { ok: true },
    }));

    assert.deepEqual(result, { ok: true });

    const persisted = await store.readState();
    assert.equal(persisted.version, 2);
    assert.equal(persisted.updatedAt, "2026-04-18T00:00:00.000Z");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
