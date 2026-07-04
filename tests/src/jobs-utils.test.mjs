import test from "node:test";
import assert from "node:assert/strict";
import {
  filterJobBuckets,
  resolveSelectedJobId,
} from "../../src/utils/jobs.js";

const jobs = {
  topicIngestion: [
    { id: "i1", scenarioKey: "consumer-tech", label: "科技采集" },
    { id: "i2", scenarioKey: "beauty", label: "美妆采集" },
  ],
  generation: [
    { id: "g1", scenarioKey: "consumer-tech", label: "科技生成" },
    { id: "g2", scenarioKey: "beauty", label: "美妆生成" },
  ],
  distribution: [
    { id: "d1", scenarioKey: "consumer-tech", label: "科技分发" },
  ],
};

test("filterJobBuckets returns only jobs for the active scenario in current scope", () => {
  const filtered = filterJobBuckets(jobs, "beauty", "current");

  assert.deepEqual(filtered.topicIngestion.map((job) => job.id), ["i2"]);
  assert.deepEqual(filtered.generation.map((job) => job.id), ["g2"]);
  assert.deepEqual(filtered.distribution.map((job) => job.id), []);
});

test("filterJobBuckets keeps all jobs in all scope", () => {
  const filtered = filterJobBuckets(jobs, "beauty", "all");

  assert.deepEqual(filtered.topicIngestion.map((job) => job.id), ["i1", "i2"]);
  assert.deepEqual(filtered.generation.map((job) => job.id), ["g1", "g2"]);
  assert.deepEqual(filtered.distribution.map((job) => job.id), ["d1"]);
});

test("resolveSelectedJobId keeps the current selection when it stays visible", () => {
  assert.equal(resolveSelectedJobId(jobs, "beauty", "all", "g1"), "g1");
});

test("resolveSelectedJobId falls back to the first visible job when current selection is hidden", () => {
  assert.equal(resolveSelectedJobId(jobs, "beauty", "current", "g1"), "i2");
});

test("resolveSelectedJobId returns empty string when there are no visible jobs", () => {
  assert.equal(
    resolveSelectedJobId(
      { topicIngestion: [], generation: [], distribution: [] },
      "beauty",
      "current",
      "g1",
    ),
    "",
  );
});
