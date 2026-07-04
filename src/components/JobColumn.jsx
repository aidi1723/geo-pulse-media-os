import React from "react";

const statusLabelMap = {
  completed: "已完成",
  queued: "排队中",
  running: "执行中",
  failed: "失败",
  canceled: "已取消",
};

export default function JobColumn({ title, jobs, selectedJobId, onSelectJob }) {
  return (
    <div className="job-column">
      <h4>{title}</h4>
      <div className="job-list">
        {jobs.length === 0 ? (
          <p className="job-empty">暂无任务</p>
        ) : (
          jobs.map((job) => (
            <button
              key={job.id}
              className={`job-item job-button ${selectedJobId === job.id ? "selected" : ""}`}
              onClick={() => onSelectJob(job.id)}
              type="button"
            >
              <div className="job-row">
                <strong>{job.label}</strong>
                <span className={`job-status job-status-${job.status}`}>
                  {statusLabelMap[job.status] ?? job.status}
                </span>
              </div>
              <p>{job.detail}</p>
              <small>{new Date(job.createdAt).toLocaleString("zh-CN", { hour12: false })}</small>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
