import http from "node:http";
import { HOST, PORT } from "./config.mjs";
import { withRequestLogging } from "./http.mjs";
import { handleRequest } from "./router.mjs";

const server = http.createServer(withRequestLogging(handleRequest));

function formatDisplayHost(host) {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}

server.listen(PORT, HOST, () => {
  console.log(`GEO-Pulse API listening on http://${formatDisplayHost(HOST)}:${PORT}`);
});
