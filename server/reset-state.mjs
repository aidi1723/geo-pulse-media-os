import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { STATE_FILE } from "./config.mjs";
import { createInitialState } from "./domain.mjs";

await mkdir(path.dirname(STATE_FILE), { recursive: true });
await writeFile(STATE_FILE, JSON.stringify(createInitialState(), null, 2), "utf8");

console.log(`State reset to clean seed at ${STATE_FILE}`);
