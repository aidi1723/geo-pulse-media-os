import React from "react";

const reviewStatusMap = {
  not_required: "无需审核",
  pending_review: "待审核",
  approved: "已通过",
  rejected: "已驳回",
};

const actionLabelMap = {
  approve: "通过",
  reject: "驳回",
  retry: "重试",
  cancel: "取消",
};

const historyLabelMap = {
  created: "创建",
  approve: "通过",
  reject: "驳回",
  retry: "重试",
  cancel: "取消",
  note_added: "备注",
};

function ArtifactView({ artifact }) {
  if (!artifact) {
    return null;
  }

  if (artifact.type === "copy_draft") {
    return (
      <section className="artifact-card">
        <div className="artifact-head">
          <div>
            <span>内容草稿</span>
            <h5>{artifact.title}</h5>
          </div>
          <div className="artifact-meta">
            <small>{artifact.tone}</small>
            <small>{artifact.assetMode}</small>
          </div>
        </div>
        <pre className="artifact-copy">{artifact.content}</pre>
      </section>
    );
  }

  if (artifact.type === "distribution_plan") {
    return (
      <section className="artifact-card">
        <div className="artifact-head">
          <div>
            <span>发布排期</span>
            <h5>{artifact.title}</h5>
          </div>
        </div>
        <div className="artifact-list">
          {artifact.channels.map((channel) => (
            <article key={`${channel.name}-${channel.schedule}`} className="artifact-row">
              <strong>{channel.name}</strong>
              <p>{channel.asset ?? "未指定素材"}</p>
              <small>{channel.schedule}</small>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (artifact.type === "topic_refresh") {
    return (
      <section className="artifact-card">
        <div className="artifact-head">
          <div>
            <span>采集结果</span>
            <h5>{artifact.title}</h5>
          </div>
        </div>
        <div className="detail-grid compact">
          <div>
            <span>刷新条数</span>
            <strong>{artifact.refreshedTopics}</strong>
          </div>
        </div>
        <p className="job-detail-result">{artifact.summary}</p>
      </section>
    );
  }

  return (
    <section className="artifact-card">
      <div className="artifact-head">
        <div>
          <span>任务产物</span>
          <h5>{artifact.title}</h5>
        </div>
      </div>
      <p className="job-detail-result">{artifact.summary}</p>
    </section>
  );
}

export default function JobDetailCard({
  job,
  busyAction,
  noteDraft,
  onOpenWorkspace,
  onChangeNote,
  onAction,
  onSaveNote,
}) {
  if (!job) {
    return (
      <div className="job-detail-card">
        <p className="job-empty">请选择一个任务查看详情。</p>
      </div>
    );
  }

  return (
    <div className="job-detail-card">
      <div className="job-detail-head">
        <div>
          <p className="eyebrow">任务详情</p>
          <h4>{job.label}</h4>
        </div>
        <span className={`job-status job-status-${job.status}`}>
          {reviewStatusMap[job.reviewStatus] ?? "未知"}
        </span>
      </div>

      <div className="detail-grid">
        <div>
          <span>任务状态</span>
          <strong>{job.status}</strong>
        </div>
        <div>
          <span>场景</span>
          <strong>{job.scenarioKey}</strong>
        </div>
        <div>
          <span>最近更新</span>
          <strong>
            {new Date(job.lastActionAt ?? job.completedAt ?? job.createdAt).toLocaleString("zh-CN", {
              hour12: false,
            })}
          </strong>
        </div>
      </div>

      <p className="job-detail-copy">{job.detail}</p>
      <p className="job-detail-result">{job.resultSummary ?? "暂无结果摘要"}</p>

      {job.reviewComment ? (
        <div className="review-card">
          <span>审核意见</span>
          <p>{job.reviewComment}</p>
        </div>
      ) : null}

      {job.artifact ? (
        <div className="job-actions workspace-link-row">
          <button className="primary-button" onClick={onOpenWorkspace} type="button" disabled={busyAction !== ""}>
            {job.artifact.type === "copy_draft"
              ? "回到创作舱"
              : job.artifact.type === "distribution_plan"
                ? "回到分发矩阵"
                : job.artifact.type === "topic_refresh"
                  ? "回到选题雷达"
                  : "打开执行界面"}
          </button>
        </div>
      ) : null}

      <ArtifactView artifact={job.artifact} />

      <div className="note-editor">
        <label htmlFor="job-note">备注 / 审核说明</label>
        <textarea
          id="job-note"
          rows="4"
          value={noteDraft}
          onChange={(event) => onChangeNote(event.target.value)}
          placeholder="输入审核意见、执行说明或交接备注"
          disabled={busyAction !== ""}
        />
        <div className="job-actions">
          <button
            className="ghost-button"
            onClick={onSaveNote}
            type="button"
            disabled={busyAction !== "" || noteDraft.trim() === ""}
          >
            {busyAction === "note" ? "保存中..." : "保存备注"}
          </button>
          {job.actions?.map((action) => (
            <button
              key={action}
              className={action === "approve" ? "primary-button" : "ghost-button"}
              onClick={() => onAction(action)}
              type="button"
              disabled={busyAction !== ""}
            >
              {busyAction === action ? `${actionLabelMap[action]}中...` : actionLabelMap[action]}
            </button>
          ))}
        </div>
      </div>

      <div className="history-grid">
        <section>
          <h5>最新备注</h5>
          <div className="history-list">
            {job.notes?.length ? (
              job.notes.map((note) => (
                <article key={note.id} className="history-item">
                  <strong>{note.author}</strong>
                  <p>{note.text}</p>
                  <small>{new Date(note.createdAt).toLocaleString("zh-CN", { hour12: false })}</small>
                </article>
              ))
            ) : (
              <p className="job-empty">暂无备注</p>
            )}
          </div>
        </section>

        <section>
          <h5>操作历史</h5>
          <div className="history-list">
            {job.history?.length ? (
              job.history.map((entry) => (
                <article key={entry.id} className="history-item">
                  <strong>{historyLabelMap[entry.action] ?? entry.action}</strong>
                  <p>{entry.note || "无附加说明"}</p>
                  <small>{new Date(entry.createdAt).toLocaleString("zh-CN", { hour12: false })}</small>
                </article>
              ))
            ) : (
              <p className="job-empty">暂无历史</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
