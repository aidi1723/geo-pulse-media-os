export function formatDisplayHost(host) {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}

export function formatServerUrl(host, port) {
  return `http://${formatDisplayHost(host)}:${port}`;
}
