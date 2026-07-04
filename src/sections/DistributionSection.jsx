import React from "react";
import SectionHeader from "../components/SectionHeader";
import StatusBadge from "../components/StatusBadge";

export default function DistributionSection({
  channels,
  highlightedChannelNames,
  onSchedule,
  isLoading,
}) {
  return (
    <article className="panel active">
      <SectionHeader
        eyebrow="Arcs-MCP 分发引擎"
        title="矩阵发布控制台"
        action={
          <button
            className="primary-button panel-action"
            onClick={onSchedule}
            type="button"
            disabled={isLoading}
          >
            {isLoading ? "创建中..." : "创建发布任务"}
          </button>
        }
      />

      <div className="distribution-grid">
        {channels.map((channel) => (
          <article
            key={channel.name}
            className={`distribution-card ${
              highlightedChannelNames.includes(channel.name) ? "highlighted-card" : ""
            }`}
          >
            <header>
              <h4>{channel.name}</h4>
              <StatusBadge status={channel.status} label={channel.label} />
            </header>
            <p>发布素材: {channel.copy}</p>
            <p>计划时间: {channel.schedule}</p>
            <div className="progress-bar" aria-label="发布准备进度">
              <span style={{ width: `${channel.progress}%` }} />
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}
