import { buildWorkspaceState, createTopicPayload } from "../utils/workspace.js";

const EMPTY_JOBS = {
  topicIngestion: [],
  generation: [],
  distribution: [],
};

const EMPTY_COPY_PLACEHOLDER = "在这里生成与当前行业场景匹配的图文、长文或脚本草稿。";

export function createInitialWorkspaceState(defaults) {
  const initialScenario = defaults.scenarios[0];
  const initialTopics = defaults.topicsByScenario[initialScenario.key] ?? [];

  return {
    navItems: defaults.navItems,
    metrics: defaults.metrics,
    scenarios: defaults.scenarios,
    automationRail: defaults.automationRail,
    modules: defaults.platformModules,
    distributionChannels: defaults.distributionChannels,
    securityItems: defaults.securityItems,
    timelineSteps: defaults.timelineSteps,
    toneNames: defaults.toneNames,
    assetModes: defaults.assetModes,
    scenarioKey: initialScenario.key,
    scenario: initialScenario,
    topics: initialTopics,
    selectedTopic: createTopicPayload(initialTopics[0]),
    tone: defaults.toneNames[0] ?? "",
    assetMode: defaults.assetModes[0] ?? "",
    copyPreview: EMPTY_COPY_PLACEHOLDER,
    commandPreview: initialScenario.command,
    banner: "系统状态运行中，今日任务按优先级自动编排。",
    suggestion: defaults.suggestions.overview,
    jobs: EMPTY_JOBS,
    selectedJobId: "",
  };
}

export function applyWorkspacePayloadToState(currentState, payload, defaults, bannerOverride = payload.banner) {
  const nextState = buildWorkspaceState({
    ...payload,
    banner: bannerOverride,
  });

  return {
    ...currentState,
    navItems: payload.navItems ?? defaults.navItems,
    metrics: payload.metrics ?? defaults.metrics,
    scenarios: payload.scenarios ?? defaults.scenarios,
    automationRail: payload.automationRail ?? defaults.automationRail,
    modules: payload.platformModules ?? defaults.platformModules,
    distributionChannels: payload.distributionChannels ?? defaults.distributionChannels,
    securityItems: payload.securityItems ?? defaults.securityItems,
    timelineSteps: payload.timelineSteps ?? defaults.timelineSteps,
    toneNames: payload.tones ?? defaults.toneNames,
    assetModes: payload.assetModes ?? defaults.assetModes,
    scenario: nextState.scenario ?? defaults.scenarios[0],
    scenarioKey: nextState.scenarioKey || defaults.scenarios[0].key,
    topics: nextState.topics,
    selectedTopic: nextState.selectedTopic,
    tone: nextState.tone,
    assetMode: nextState.assetMode,
    copyPreview: nextState.copyPreview,
    commandPreview: nextState.commandPreview,
    banner: nextState.banner,
    suggestion: nextState.suggestion || defaults.suggestions.overview,
    jobs: nextState.jobs,
    selectedJobId: nextState.selectedJobId,
  };
}
