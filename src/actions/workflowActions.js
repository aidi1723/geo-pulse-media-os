import { prepareGenerationPayload } from "../utils/generation.js";
import { pickRelevantJobId } from "../utils/workspace.js";

export function createWorkflowActions({ services, workspace, ui, getState }) {
  async function generateDraft() {
    ui.setBusyAction("generate");
    try {
      const state = getState();
      const result = await services.generateDraft(
        prepareGenerationPayload({
          topics: state.topics,
          selectedTopic: state.selectedTopic,
          tone: state.tone,
          assetMode: state.assetMode,
          scenarioKey: state.scenarioKey,
        }),
      );

      workspace.setCopyPreview(result.content);
      workspace.setBanner(result.status);
      ui.setHighlightedChannelNames([]);
      workspace.setJobs(result.jobs);
      workspace.setSelectedJobId(result.job.id);
      ui.setAppError("");
    } catch (error) {
      ui.setAppError(error.message);
    } finally {
      ui.setBusyAction("");
    }
  }

  async function runWorkflow() {
    ui.setBusyAction("workflow");
    try {
      const { scenarioKey } = getState();
      const result = await services.runWorkflow(scenarioKey);

      workspace.setCommandPreview(result.banner);
      workspace.setBanner(result.status);
      ui.setHighlightedChannelNames([]);
      workspace.setJobs(result.jobs);
      workspace.setSelectedJobId(result.focusJobId ?? pickRelevantJobId(result.jobs, scenarioKey));
      ui.setAppError("");
    } catch (error) {
      ui.setAppError(error.message);
    } finally {
      ui.setBusyAction("");
    }
  }

  async function refreshTopics() {
    ui.setBusyAction("refresh");
    try {
      const { scenarioKey } = getState();
      const result = await services.refreshTopics(scenarioKey);

      workspace.setTopics(result.topics);
      workspace.setBanner(result.banner);
      ui.setHighlightedChannelNames([]);
      workspace.setJobs(result.jobs);
      workspace.setSelectedJobId(result.job.id);
      ui.setAppError("");
    } catch (error) {
      ui.setAppError(error.message);
    } finally {
      ui.setBusyAction("");
    }
  }

  async function scheduleDistribution() {
    ui.setBusyAction("distribution");
    try {
      const { scenarioKey } = getState();
      const result = await services.scheduleDistribution({ scenarioKey });

      ui.setActiveView("distribution");
      workspace.setBanner(result.banner);
      ui.setHighlightedChannelNames([]);
      workspace.setJobs(result.jobs);
      workspace.setSelectedJobId(result.job.id);
      ui.setAppError("");
    } catch (error) {
      ui.setAppError(error.message);
    } finally {
      ui.setBusyAction("");
    }
  }

  return {
    generateDraft,
    runWorkflow,
    refreshTopics,
    scheduleDistribution,
  };
}
