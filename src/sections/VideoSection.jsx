import React from "react";
import SectionHeader from "../components/SectionHeader";

export default function VideoSection({ timeline }) {
  return (
    <article className="panel active">
      <SectionHeader
        eyebrow="视频生产"
        title="30 秒爆点脚本流水线"
        action={
          <button className="ghost-button panel-action" type="button">
            导出脚本卡
          </button>
        }
      />

      <div className="timeline">
        {timeline.map((step) => (
          <article key={step.time} className="timeline-card">
            <strong>{step.time}</strong>
            <div>
              <h4>{step.title}</h4>
              <p>{step.detail}</p>
            </div>
            <div className="timeline-tag">
              <span className="tag">{step.tag}</span>
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}
