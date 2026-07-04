import React from "react";
import JobColumn from "./JobColumn";
import JobDetailCard from "./JobDetailCard";
import { filterJobBuckets } from "../utils/jobs";

export default function TaskBoard({
  jobs,
  activeScenarioKey,
  activeScenarioName,
  taskScope,
  onChangeTaskScope,
  selectedJobId,
  selectedJob,
  busyAction,
  noteDraft,
  onSelectJob,
  onOpenWorkspace,
  onChangeNote,
  onAction,
  onSaveNote,
}) {
  const visibleJobs = filterJobBuckets(jobs, activeScenarioKey, taskScope);
  const visibleCount =
    visibleJobs.topicIngestion.length +
    visibleJobs.generation.length +
    visibleJobs.distribution.length;

  return (
    <article className="rail-card task-board-card">
      <div className="task-board-head">
        <div>
          <p className="eyebrow">任务队列</p>
          <h3>后端任务表</h3>
        </div>
        <div className="task-scope-switch" aria-label="任务范围切换">
          <button
            className={`scope-chip ${taskScope === "current" ? "active" : ""}`}
            onClick={() => onChangeTaskScope("current")}
            type="button"
            aria-pressed={taskScope === "current"}
          >
            当前场景
          </button>
          <button
            className={`scope-chip ${taskScope === "all" ? "active" : ""}`}
            onClick={() => onChangeTaskScope("all")}
            type="button"
            aria-pressed={taskScope === "all"}
          >
            全部任务
          </button>
        </div>
      </div>

      <p className="task-scope-note">
        {taskScope === "current"
          ? `当前仅显示 ${activeScenarioName} 场景任务，共 ${visibleCount} 条。`
          : `当前显示全部场景任务，共 ${visibleCount} 条。`}
      </p>

      <div className="job-board">
        <JobColumn
          title="选题采集"
          jobs={visibleJobs.topicIngestion}
          selectedJobId={selectedJobId}
          onSelectJob={onSelectJob}
        />
        <JobColumn
          title="内容生成"
          jobs={visibleJobs.generation}
          selectedJobId={selectedJobId}
          onSelectJob={onSelectJob}
        />
        <JobColumn
          title="发布调度"
          jobs={visibleJobs.distribution}
          selectedJobId={selectedJobId}
          onSelectJob={onSelectJob}
        />
        <JobDetailCard
          job={selectedJob}
          busyAction={busyAction}
          noteDraft={noteDraft}
          onOpenWorkspace={onOpenWorkspace}
          onChangeNote={onChangeNote}
          onAction={onAction}
          onSaveNote={onSaveNote}
        />
      </div>
    </article>
  );
}
