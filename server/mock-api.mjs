import http from "node:http";
import { HOST, PORT } from "./config.mjs";
import { formatServerUrl } from "./display-url.mjs";
import { withRequestLogging } from "./http.mjs";
import { handleRequest } from "./router.mjs";

const server = http.createServer(withRequestLogging(handleRequest));

server.listen(PORT, HOST, () => {
  console.log(`GEO-Pulse API listening on ${formatServerUrl(HOST, PORT)}`);
});
