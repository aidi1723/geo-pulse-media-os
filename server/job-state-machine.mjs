import { ApiError } from "./http.mjs";

export function getAvailableJobActions(job) {
  const actions = ["retry"];

  if (job.status === "queued" || job.status === "running") {
    actions.push("cancel");
  }

  if (job.reviewStatus === "pending_review") {
    actions.push("approve", "reject");
  }

  if (job.status === "failed" || job.status === "canceled") {
    return ["retry"];
  }

  return actions;
}

export function transitionJobForAction(job, action, { now, note = "" }) {
  if (!getAvailableJobActions(job).includes(action)) {
    throw new ApiError(409, `Action not allowed: ${action}`);
  }

  const nextJob = { ...job };

  if (action === "approve") {
    nextJob.reviewStatus = "approved";
    if (nextJob.kind === "distribution" && nextJob.status === "queued") {
      nextJob.status = "running";
    }
    nextJob.resultSummary = "审核已通过，任务保持可执行状态。";
    nextJob.reviewComment = note || nextJob.reviewComment;
  }

  if (action === "reject") {
    nextJob.reviewStatus = "rejected";
    nextJob.status = "failed";
    nextJob.resultSummary = "任务已驳回，等待重新生成或重新排队。";
    nextJob.reviewComment = note || nextJob.reviewComment;
  }

  if (action === "retry") {
    nextJob.retryCount = (nextJob.retryCount ?? 0) + 1;
    nextJob.reviewStatus =
      nextJob.kind === "topic_ingestion" || nextJob.kind === "workflow"
        ? "not_required"
        : "pending_review";
    nextJob.status = nextJob.kind === "distribution" ? "queued" : "completed";
    nextJob.createdAt = now;
    nextJob.completedAt = nextJob.kind === "distribution" ? undefined : now;
    nextJob.resultSummary = "任务已重试并刷新最新结果。";
    nextJob.detail = `${job.detail} / 已重试 ${nextJob.retryCount} 次`;
  }

  if (action === "cancel") {
    nextJob.status = "canceled";
    nextJob.reviewStatus =
      nextJob.reviewStatus === "pending_review" ? "rejected" : nextJob.reviewStatus;
    nextJob.resultSummary = "任务已取消，不会继续执行。";
  }

  return nextJob;
}
