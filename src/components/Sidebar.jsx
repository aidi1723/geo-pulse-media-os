import React from "react";

export default function Sidebar({ navItems, activeView, onChangeView }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">GP</div>
        <div>
          <p className="eyebrow">AI Media OS</p>
          <h1>极脉智媒</h1>
        </div>
      </div>

      <nav className="nav-menu" aria-label="主导航">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${activeView === item.key ? "active" : ""}`}
            onClick={() => onChangeView(item.key)}
            type="button"
          >
            <span>{item.label}</span>
            <small>{item.caption}</small>
          </button>
        ))}
      </nav>

      <section className="sidebar-card">
        <p className="eyebrow">今日自动流</p>
        <div className="workflow-meter">
          <div>
            <strong>18</strong>
            <span>待处理选题</span>
          </div>
          <div>
            <strong>7</strong>
            <span>生成中任务</span>
          </div>
          <div>
            <strong>23</strong>
            <span>待分发账号</span>
          </div>
        </div>
      </section>
    </aside>
  );
}
