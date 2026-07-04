import React from "react";
import SectionHeader from "../components/SectionHeader";

export default function DiscoverySection({ topics, onSelectTopic, onRefresh, isLoading }) {
  return (
    <article className="panel active">
      <SectionHeader
        eyebrow="QwenPaw + 热点聚合"
        title="跨平台选题雷达"
        action={
          <button
            className="ghost-button panel-action"
            onClick={onRefresh}
            type="button"
            disabled={isLoading}
          >
            {isLoading ? "刷新中..." : "刷新热榜"}
          </button>
        }
      />

      <div className="topic-list">
        {topics.map((topic) => (
          <article key={topic.id} className="topic-card">
            <div className="topic-meta">
              <span className="source-badge">{topic.source}</span>
              <span className="heat-score">{topic.heat}</span>
            </div>
            <h4 className="topic-title">{topic.title}</h4>
            <p className="topic-summary">{topic.summary}</p>
            <div className="topic-tags">
              {topic.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="topic-footer">
              <span className="topic-angle">{topic.angle}</span>
              <button
                className="ghost-button topic-action"
                onClick={() => onSelectTopic(topic)}
                type="button"
              >
                推送到创作舱
              </button>
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}
