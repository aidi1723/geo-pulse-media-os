import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const HOST = "127.0.0.1";
export const PORT = 8787;
export const STATE_FILE = path.join(__dirname, "data", "state.json");
