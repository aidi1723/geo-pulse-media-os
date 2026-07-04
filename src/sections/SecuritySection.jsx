import React from "react";
import SectionHeader from "../components/SectionHeader";
import StatusBadge from "../components/StatusBadge";

export default function SecuritySection({ items }) {
  return (
    <article className="panel active">
      <SectionHeader
        eyebrow="TOPIAM 权限隔离"
        title="账号安全与权限编排"
        action={
          <button className="ghost-button panel-action" type="button">
            查看审计日志
          </button>
        }
      />

      <div className="security-grid">
        {items.map((item) => (
          <article key={item.title} className="security-card">
            <header>
              <h4>{item.title}</h4>
              <StatusBadge status={item.status} label={item.label} />
            </header>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </article>
  );
}
