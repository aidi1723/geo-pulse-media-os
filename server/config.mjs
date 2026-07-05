import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 8787;
export const DEFAULT_STATE_FILE = path.join(__dirname, "data", "state.json");

function parsePort(value) {
  if (value === undefined || value === "") {
    return DEFAULT_PORT;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("GEO_PULSE_API_PORT must be an integer between 1 and 65535");
  }

  return port;
}

export const HOST = process.env.GEO_PULSE_API_HOST || DEFAULT_HOST;
export const PORT = parsePort(process.env.GEO_PULSE_API_PORT);
export const STATE_FILE = process.env.GEO_PULSE_STATE_FILE || DEFAULT_STATE_FILE;
