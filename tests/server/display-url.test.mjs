import test from "node:test";
import assert from "node:assert/strict";
import { formatDisplayHost, formatServerUrl } from "../../server/display-url.mjs";

test("formatDisplayHost leaves IPv4 and hostnames unchanged", () => {
  assert.equal(formatDisplayHost("127.0.0.1"), "127.0.0.1");
  assert.equal(formatDisplayHost("localhost"), "localhost");
});

test("formatDisplayHost brackets IPv6 hosts for display", () => {
  assert.equal(formatDisplayHost("::1"), "[::1]");
  assert.equal(formatDisplayHost("[::1]"), "[::1]");
});

test("formatServerUrl formats HTTP URLs for IPv4, hostnames, and IPv6", () => {
  assert.equal(formatServerUrl("127.0.0.1", 8787), "http://127.0.0.1:8787");
  assert.equal(formatServerUrl("localhost", 8787), "http://localhost:8787");
  assert.equal(formatServerUrl("::1", 8787), "http://[::1]:8787");
});
