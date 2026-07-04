import http from "node:http";
import { HOST, PORT } from "./config.mjs";
import { handleRequest } from "./router.mjs";

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`GEO-Pulse API listening on http://${HOST}:${PORT}`);
});
