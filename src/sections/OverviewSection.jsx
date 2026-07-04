import React from "react";
import SectionHeader from "../components/SectionHeader";

export default function OverviewSection({ scenario, modules }) {
  return (
    <article className="panel active">
      <SectionHeader
        eyebrow="闭环概览"
        title="今日运营主线"
        action={
          <button className="ghost-button panel-action" type="button">
            导出日报
          </button>
        }
      />

      <div className="journey-strip">
        <div className="journey-step active">
          <span>01</span>
          <div>
            <strong>热点采集</strong>
            <p>12 个来源已更新</p>
          </div>
        </div>
        <div className="journey-step active">
          <span>02</span>
          <div>
            <strong>内容生成</strong>
            <p>9 个稿件已出初版</p>
          </div>
        </div>
        <div className="journey-step">
          <span>03</span>
          <div>
            <strong>矩阵发布</strong>
            <p>14:30 开始首轮分发</p>
          </div>
        </div>
        <div className="journey-step">
          <span>04</span>
          <div>
            <strong>效果复盘</strong>
            <p>今晚 22:00 自动汇总</p>
          </div>
        </div>
      </div>

      <div className="insight-grid">
        <article className="glass-card">
          <p className="eyebrow">策略建议</p>
          <h4>{scenario.strategyTitle}</h4>
          <p>{scenario.strategyBody}</p>
        </article>
        <article className="glass-card">
          <p className="eyebrow">分发建议</p>
          <h4>优化发布时间窗</h4>
          <p>{scenario.distributionBody}</p>
        </article>
      </div>

      <div className="module-grid">
        {modules.map((module) => (
          <article key={module.name} className="module-card">
            <p className="eyebrow">系统域</p>
            <h4>{module.name}</h4>
            <p>{module.detail}</p>
          </article>
        ))}
      </div>
    </article>
  );
}
