import { createTopicPayload } from "../utils/workspace.js";

export async function openWorkspaceFromJob({
  selectedJob,
  scenarioKey,
  topics,
  services,
  workspace,
  ui,
}) {
  if (!selectedJob) {
    return;
  }

  ui.setBusyAction("open-workspace");
  try {
    let currentTopics = topics;

    if (selectedJob.scenarioKey !== scenarioKey) {
      const scenarioPayload = await services.loadScenarioContext(selectedJob.scenarioKey);
      currentTopics = Array.isArray(scenarioPayload?.topics) ? scenarioPayload.topics : topics;
    }

    const artifact = selectedJob.artifact;

    if (artifact?.type === "copy_draft") {
      const matchTopic = currentTopics.find((item) => item.title === artifact.title);
      workspace.setSelectedTopic(
        matchTopic
          ? createTopicPayload(matchTopic)
          : `${artifact.title}\n\n来自任务产物预览`,
      );
      if (artifact.content) {
        workspace.setCopyPreview(artifact.content);
      }
      if (artifact.tone) {
        workspace.setTone(artifact.tone);
      }
      if (artifact.assetMode) {
        workspace.setAssetMode(artifact.assetMode);
      }
      ui.setActiveView("studio");
      ui.setHighlightedChannelNames([]);
      workspace.setBanner(`已从任务“${selectedJob.label}”回到创作舱。`);
      return;
    }

    if (artifact?.type === "distribution_plan") {
      const channels = Array.isArray(artifact.channels) ? artifact.channels : [];
      ui.setActiveView("distribution");
      ui.setHighlightedChannelNames(channels.map((channel) => channel.name));
      workspace.setBanner(`已从任务“${selectedJob.label}”定位到对应分发排期。`);
      return;
    }

    if (artifact?.type === "topic_refresh") {
      ui.setActiveView("discovery");
      ui.setHighlightedChannelNames([]);
      workspace.setBanner(`已从任务“${selectedJob.label}”回到选题雷达。`);
    }
  } catch (error) {
    ui.setAppError(error.message);
  } finally {
    ui.setBusyAction("");
  }
}
