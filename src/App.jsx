import React from "react";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import MetricCard from "./components/MetricCard";
import TaskBoard from "./components/TaskBoard";
import DiscoverySection from "./sections/DiscoverySection";
import DistributionSection from "./sections/DistributionSection";
import OverviewSection from "./sections/OverviewSection";
import SecuritySection from "./sections/SecuritySection";
import StudioSection from "./sections/StudioSection";
import VideoSection from "./sections/VideoSection";
import { createJobActions } from "./actions/jobActions";
import { openWorkspaceFromJob } from "./actions/artifactRouting";
import { createWorkflowActions } from "./actions/workflowActions";
import { useWorkspaceController } from "./hooks/useWorkspaceController";
import { resolveSelectedJobId } from "./utils/jobs";
import { createTopicPayload } from "./utils/workspace";
import {
  automationRail,
  assetModes,
  distributionChannels,
  metrics,
  navItems,
  platformModules,
  scenarios,
  securityItems,
  suggestions,
  timelineSteps,
  toneVariants,
  topicsByScenario,
} from "./data/mockData";
import {
  addJobNote,
  generateDraft,
  getBootstrapData,
  getJobDetail,
  refreshTopics,
  runJobAction,
  runWorkflow,
  scheduleDistribution,
} from "./services/orchestrator";

const workspaceDefaults = {
  navItems,
  metrics,
  scenarios,
  topicsByScenario,
  toneNames: Object.keys(toneVariants),
  assetModes,
  suggestions,
  automationRail,
  platformModules,
  distributionChannels,
  securityItems,
  timelineSteps,
};

export default function App() {
  const [activeView, setActiveView] = useState("overview");
  const [busyAction, setBusyAction] = useState("");
  const [highlightedChannelNames, setHighlightedChannelNames] = useState([]);
  const [taskScope, setTaskScope] = useState("current");
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobActionBusy, setJobActionBusy] = useState("");
  const [jobNoteDraft, setJobNoteDraft] = useState("");
  const [appError, setAppError] = useState("");
  const isGlobalBusy = busyAction !== "";
  const workspaceController = useWorkspaceController(workspaceDefaults);
  const {
    workspace,
    applyWorkspacePayload,
    setSelectedTopic,
    setTone,
    setAssetMode,
    setCopyPreview,
    setCommandPreview,
    setBanner,
    setSuggestion,
    setTopics,
    setJobs: setAppJobs,
    setSelectedJobId,
  } = workspaceController;
  const {
    navItems: appNavItems,
    metrics: appMetrics,
    scenarios: appScenarios,
    automationRail: appAutomationRail,
    modules: appModules,
    distributionChannels: appDistributionChannels,
    securityItems: appSecurityItems,
    timelineSteps: appTimelineSteps,
    toneNames: appToneNames,
    assetModes: appAssetModes,
    scenarioKey,
    scenario,
    topics,
    selectedTopic,
    tone,
    assetMode,
    copyPreview,
    commandPreview,
    banner,
    suggestion,
    jobs: appJobs,
    selectedJobId,
  } = workspace;
  const workflowActions = createWorkflowActions({
    services: {
      generateDraft,
      runWorkflow,
      refreshTopics,
      scheduleDistribution,
    },
    workspace: {
      setCopyPreview,
      setBanner,
      setJobs: setAppJobs,
      setSelectedJobId,
      setCommandPreview,
      setTopics,
    },
    ui: {
      setBusyAction,
      setHighlightedChannelNames,
      setAppError,
      setActiveView,
    },
    getState: () => ({
      topics,
      selectedTopic,
      tone,
      assetMode,
      scenarioKey,
    }),
  });
  const jobActions = createJobActions({
    services: {
      addJobNote,
      runJobAction,
    },
    workspace: {
      setSelectedJob,
      setJobs: setAppJobs,
      setBanner,
    },
    ui: {
      setJobActionBusy,
      setHighlightedChannelNames,
      setJobNoteDraft,
      setAppError,
    },
    getState: () => ({
      selectedJobId,
      jobNoteDraft,
    }),
  });

  useEffect(() => {
    setSuggestion(suggestions[activeView]);
  }, [activeView]);

  useEffect(() => {
    const nextJobId = resolveSelectedJobId(appJobs, scenarioKey, taskScope, selectedJobId);

    if (nextJobId !== selectedJobId) {
      setSelectedJobId(nextJobId);
    }
  }, [appJobs, scenarioKey, selectedJobId, taskScope]);

  async function loadScenarioContext(nextKey) {
    const payload = await getBootstrapData(nextKey);
    applyWorkspacePayload(payload);
    return payload;
  }

  useEffect(() => {
    let isActive = true;

    async function loadSelectedJob() {
      if (!selectedJobId) {
        setSelectedJob(null);
        return;
      }

      try {
        const payload = await getJobDetail(selectedJobId);
        if (isActive) {
          setSelectedJob(payload);
          setJobNoteDraft("");
        }
      } catch (error) {
        if (isActive) {
          setAppError(error.message);
        }
      }
    }

    loadSelectedJob();

    return () => {
      isActive = false;
    };
  }, [selectedJobId]);

  useEffect(() => {
    let isActive = true;

    async function bootstrap() {
      try {
        setBusyAction("bootstrap");
        const payload = await getBootstrapData(scenarioKey);

        if (!isActive) {
          return;
        }

        applyWorkspacePayload(payload);
        setAppError("");
      } catch (error) {
        if (!isActive) {
          return;
        }

        setAppError("本地 API 未连接，当前显示的是前端内置演示数据。");
        setBanner("未连接到本地 API。请先执行 `npm run dev:api`，前端会自动切换到真实接口。");
      } finally {
        if (isActive) {
          setBusyAction("");
        }
      }
    }

    bootstrap();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleScenarioChange(nextKey) {
    setBusyAction("scenario");
    try {
      const payload = await getBootstrapData(nextKey);
      applyWorkspacePayload(payload, `行业场景已切换为 ${payload.scenario.name}，已同步更新热点池和策略建议。`);
      setActiveView("overview");
      setHighlightedChannelNames([]);
      setAppError("");
    } catch (error) {
      setAppError(error.message);
    } finally {
      setBusyAction("");
    }
  }

  const handleGenerateDraft = workflowActions.generateDraft;
  const handleRunWorkflow = workflowActions.runWorkflow;
  const handleRefreshTopics = workflowActions.refreshTopics;
  const handleScheduleDistribution = workflowActions.scheduleDistribution;
  const handleSaveNote = jobActions.saveNote;
  const handleJobAction = jobActions.runAction;

  function handleSelectTopic(topic) {
    setSelectedTopic(createTopicPayload(topic));
    setActiveView("studio");
    setHighlightedChannelNames([]);
    setBanner(`已将选题“${topic.title}”推送到创作舱。`);
  }

  async function handleOpenWorkspaceFromJob() {
    return openWorkspaceFromJob({
      selectedJob,
      scenarioKey,
      topics,
      services: { loadScenarioContext },
      workspace: { setSelectedTopic, setCopyPreview, setTone, setAssetMode, setBanner },
      ui: { setActiveView, setHighlightedChannelNames, setBusyAction, setAppError },
    });
  }

  function renderPanel() {
    if (activeView === "overview") {
      return <OverviewSection scenario={scenario} modules={appModules} />;
    }

    if (activeView === "discovery") {
      return (
        <DiscoverySection
          topics={topics}
          onSelectTopic={handleSelectTopic}
          onRefresh={handleRefreshTopics}
          isLoading={busyAction === "refresh"}
        />
      );
    }

    if (activeView === "studio") {
      return (
        <StudioSection
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          tone={tone}
          setTone={setTone}
          tones={appToneNames}
          assetMode={assetMode}
          assetModes={appAssetModes}
          setAssetMode={setAssetMode}
          copyPreview={copyPreview}
          onGenerate={handleGenerateDraft}
          isLoading={busyAction === "generate"}
        />
      );
    }

    if (activeView === "video") {
      return <VideoSection timeline={appTimelineSteps} />;
    }

    if (activeView === "distribution") {
      return (
        <DistributionSection
          channels={appDistributionChannels}
          highlightedChannelNames={highlightedChannelNames}
          onSchedule={handleScheduleDistribution}
          isLoading={busyAction === "distribution"}
        />
      );
    }

    return <SecuritySection items={appSecurityItems} />;
  }

  return (
    <div className="app-shell">
      <Sidebar navItems={appNavItems} activeView={activeView} onChangeView={setActiveView} />

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">全链路 AI 自动化平台</p>
            <h2>{appNavItems.find((item) => item.key === activeView)?.label}</h2>
          </div>
          <div className="topbar-actions">
            <label className="scenario-select" htmlFor="scenario-switch">
              <span>行业场景</span>
              <select
                id="scenario-switch"
                value={scenarioKey}
                onChange={(event) => handleScenarioChange(event.target.value)}
                disabled={isGlobalBusy}
              >
                {appScenarios.map((item) => (
                  <option key={item.key} value={item.key}>
                    {busyAction === "scenario" && item.key === scenarioKey
                      ? `${item.name} - 切换中`
                      : item.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              onClick={handleRunWorkflow}
              type="button"
              disabled={isGlobalBusy}
            >
              {busyAction === "workflow" ? "执行中..." : "执行今日工作流"}
            </button>
          </div>
        </header>

        <section className="hero-grid">
          <article className="hero-card pulse-card">
            <div className="hero-copy">
              <p className="eyebrow">系统指挥台</p>
              <h3>{scenario.heroTitle}</h3>
              <p>{scenario.heroBody}</p>
            </div>
            <div className="hero-orbit" aria-hidden="true">
              <span>选题</span>
              <span>图文</span>
              <span>短视频</span>
              <span>分发</span>
            </div>
          </article>

          <article className="hero-card command-card">
            <p className="eyebrow">自然语言总控</p>
            <div className="command-box">
              <span className="command-prefix">/dispatch</span>
              <p>{commandPreview}</p>
            </div>
            <div className="chip-row">
              <button className="chip" onClick={() => setCommandPreview(scenario.command)} type="button">
                工作流模板
              </button>
              <button
                className="chip"
                onClick={() =>
                  setCommandPreview("执行模板：新品冷启动。自动完成竞品拆解、卖点文案、短视频脚本和分发排期。")
                }
                type="button"
              >
                新品冷启动
              </button>
              <button
                className="chip"
                onClick={() =>
                  setCommandPreview("执行模板：矩阵复投计划。基于历史高表现内容生成多平台复投版本。")
                }
                type="button"
              >
                矩阵复投
              </button>
            </div>
          </article>
        </section>

        <section className="status-banner">
          <strong>运行状态</strong>
          <p>{banner}</p>
        </section>

        {appError ? (
          <section className="error-banner">
            <strong>接口状态</strong>
            <p>{appError}</p>
          </section>
        ) : null}

        <section className="metric-grid">
          {appMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="workspace-grid">
          <section className="content-stage">{renderPanel()}</section>

          <aside className="right-rail">
            <article className="rail-card">
              <p className="eyebrow">自动化编排</p>
              <h3>今日执行链路</h3>
              <ol className="rail-list">
                {appAutomationRail.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </article>

            <article className="rail-card">
              <p className="eyebrow">推荐动作</p>
              <h3>下一步建议</h3>
              <div className="suggestion-card">{suggestion}</div>
            </article>

            <TaskBoard
              jobs={appJobs}
              activeScenarioKey={scenarioKey}
              activeScenarioName={scenario.name}
              taskScope={taskScope}
              onChangeTaskScope={setTaskScope}
              selectedJobId={selectedJobId}
              selectedJob={selectedJob}
              busyAction={jobActionBusy}
              noteDraft={jobNoteDraft}
              onSelectJob={setSelectedJobId}
              onOpenWorkspace={handleOpenWorkspaceFromJob}
              onChangeNote={setJobNoteDraft}
              onAction={handleJobAction}
              onSaveNote={handleSaveNote}
            />

            <article className="rail-card">
              <p className="eyebrow">系统边界</p>
              <h3>接入方向</h3>
              <ul className="bullet-list">
                <li>Topic ingestion adapter: 热榜、RSS、社媒搜索、评论区洞察。</li>
                <li>Generation adapter: 文案、封面、分镜、视频提示词统一任务流。</li>
                <li>Publishing adapter: MCP、浏览器自动化、API 发布三类插件。</li>
              </ul>
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}
