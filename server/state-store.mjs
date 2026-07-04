import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { STATE_FILE } from "./config.mjs";
import { createInitialState } from "./domain.mjs";

export function createStateStore(stateFile = STATE_FILE) {
  let writeQueue = Promise.resolve();

  async function ensureStateFile() {
    await mkdir(path.dirname(stateFile), { recursive: true });

    try {
      await readFile(stateFile, "utf8");
    } catch {
      const initial = createInitialState();
      await writeFile(stateFile, JSON.stringify(initial, null, 2), "utf8");
    }
  }

  async function readState() {
    await ensureStateFile();
    const raw = await readFile(stateFile, "utf8");
    return JSON.parse(raw);
  }

  async function updateState(mutator) {
    const run = async () => {
      const state = await readState();
      const result = await mutator(state);
      const hasExplicitNextState =
        result &&
        typeof result === "object" &&
        Object.prototype.hasOwnProperty.call(result, "nextState");
      const stateToWrite = hasExplicitNextState ? result.nextState : state;
      const response =
        hasExplicitNextState && Object.prototype.hasOwnProperty.call(result, "response")
          ? result.response
          : result;

      await writeFile(stateFile, JSON.stringify(stateToWrite, null, 2), "utf8");
      return response;
    };

    const nextRun = writeQueue.then(run, run);
    writeQueue = nextRun.then(
      () => undefined,
      () => undefined,
    );

    return nextRun;
  }

  return {
    readState,
    updateState,
  };
}

const defaultStore = createStateStore();

export const readState = defaultStore.readState;
export const updateState = defaultStore.updateState;
