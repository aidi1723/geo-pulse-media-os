import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, info) {
    console.error("App render failed", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell app-shell--error" role="alert">
          <section className="error-boundary">
            <p className="eyebrow">Runtime error</p>
            <h1>工作台暂时无法渲染</h1>
            <p>请刷新页面或查看运行日志，确认最近一次发布没有引入渲染异常。</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
