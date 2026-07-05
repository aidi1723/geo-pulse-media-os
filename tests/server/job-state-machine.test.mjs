import test from "node:test";
import assert from "node:assert/strict";
import {
  getAvailableJobActions,
  transitionJobForAction,
} from "../../server/job-state-machine.mjs";

const baseJob = {
  id: "job-1",
  kind: "generation",
  status: "completed",
  reviewStatus: "pending_review",
  detail: "生成任务",
  resultSummary: "待审核",
  reviewComment: "",
};

test("pending review generation jobs expose retry, approve, and reject", () => {
  assert.deepEqual(getAvailableJobActions(baseJob), ["retry", "approve", "reject"]);
});

test("queued pending review distribution jobs expose retry, cancel, approve, and reject", () => {
  assert.deepEqual(
    getAvailableJobActions({
      ...baseJob,
      kind: "distribution",
      status: "queued",
    }),
    ["retry", "cancel", "approve", "reject"],
  );
});

test("failed and canceled jobs expose retry only", () => {
  assert.deepEqual(getAvailableJobActions({ ...baseJob, status: "failed" }), ["retry"]);
  assert.deepEqual(getAvailableJobActions({ ...baseJob, status: "canceled" }), ["retry"]);
});

test("approve marks generation review as approved and keeps completed status", () => {
  const nextJob = transitionJobForAction(baseJob, "approve", {
    now: "2026-07-05T00:00:00.000Z",
  });

  assert.equal(nextJob.reviewStatus, "approved");
  assert.equal(nextJob.status, "completed");
  assert.equal(nextJob.resultSummary, "审核已通过，任务保持可执行状态。");
});

test("approve starts queued distribution jobs", () => {
  const nextJob = transitionJobForAction(
    {
      ...baseJob,
      kind: "distribution",
      status: "queued",
    },
    "approve",
    {
      now: "2026-07-05T00:00:00.000Z",
    },
  );

  assert.equal(nextJob.reviewStatus, "approved");
  assert.equal(nextJob.status, "running");
});

test("reject marks review as rejected and fails the job", () => {
  const nextJob = transitionJobForAction(baseJob, "reject", {
    now: "2026-07-05T00:00:00.000Z",
  });

  assert.equal(nextJob.reviewStatus, "rejected");
  assert.equal(nextJob.status, "failed");
  assert.equal(nextJob.resultSummary, "任务已驳回，等待重新生成或重新排队。");
});

test("retry refreshes completed generation jobs for review", () => {
  const nextJob = transitionJobForAction(
    {
      ...baseJob,
      retryCount: 1,
      completedAt: "2026-07-04T00:00:00.000Z",
    },
    "retry",
    {
      now: "2026-07-05T00:00:00.000Z",
    },
  );

  assert.equal(nextJob.retryCount, 2);
  assert.equal(nextJob.reviewStatus, "pending_review");
  assert.equal(nextJob.status, "completed");
  assert.equal(nextJob.createdAt, "2026-07-05T00:00:00.000Z");
  assert.equal(nextJob.completedAt, "2026-07-05T00:00:00.000Z");
  assert.equal(nextJob.detail, "生成任务 / 已重试 2 次");
});

test("retry returns distribution jobs to queued without completedAt", () => {
  const nextJob = transitionJobForAction(
    {
      ...baseJob,
      kind: "distribution",
      status: "running",
      completedAt: "2026-07-04T00:00:00.000Z",
    },
    "retry",
    {
      now: "2026-07-05T00:00:00.000Z",
    },
  );

  assert.equal(nextJob.retryCount, 1);
  assert.equal(nextJob.reviewStatus, "pending_review");
  assert.equal(nextJob.status, "queued");
  assert.equal(nextJob.createdAt, "2026-07-05T00:00:00.000Z");
  assert.equal(nextJob.completedAt, undefined);
});

test("cancel marks pending review jobs as canceled and rejected", () => {
  const nextJob = transitionJobForAction(
    {
      ...baseJob,
      status: "queued",
    },
    "cancel",
    {
      now: "2026-07-05T00:00:00.000Z",
    },
  );

  assert.equal(nextJob.status, "canceled");
  assert.equal(nextJob.reviewStatus, "rejected");
  assert.equal(nextJob.resultSummary, "任务已取消，不会继续执行。");
});

test("disallowed actions throw an API conflict", () => {
  assert.throws(
    () =>
      transitionJobForAction(
        {
          ...baseJob,
          reviewStatus: "approved",
        },
        "approve",
        {
          now: "2026-07-05T00:00:00.000Z",
        },
      ),
    /Action not allowed: approve/,
  );
});
