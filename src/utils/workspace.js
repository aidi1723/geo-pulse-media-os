const EMPTY_TOPIC_PLACEHOLDER = "请输入核心选题\n\n补充你的问题、场景和关键信息\n\n机会点: 先写切入角度";
const EMPTY_COPY_PLACEHOLDER = "在这里生成与当前行业场景匹配的图文、长文或脚本草稿。";

export function createTopicPayload(topic) {
  if (!topic) {
    return EMPTY_TOPIC_PLACEHOLDER;
  }

  return `${topic.title}\n\n${topic.summary}\n\n${topic.angle}`;
}

function pickFirstJob(jobs) {
  return jobs.topicIngestion[0]?.id ?? jobs.generation[0]?.id ?? jobs.distribution[0]?.id ?? "";
}

export function pickRelevantJobId(jobs, scenarioKey) {
  return (
    jobs.generation.find((job) => job.scenarioKey === scenarioKey)?.id ??
    jobs.distribution.find((job) => job.scenarioKey === scenarioKey)?.id ??
    jobs.topicIngestion.find((job) => job.scenarioKey === scenarioKey)?.id ??
    pickFirstJob(jobs)
  );
}

export function buildWorkspaceState(payload) {
  const jobs = payload.jobs ?? {
    topicIngestion: [],
    generation: [],
    distribution: [],
  };
  const scenario = payload.scenario ?? null;
  const topics = payload.topics ?? [];
  const tones = payload.tones ?? [];
  const assetModes = payload.assetModes ?? [];

  return {
    scenarioKey: scenario?.key ?? "",
    scenario,
    topics,
    selectedTopic: createTopicPayload(topics[0]),
    tone: tones[0] ?? "",
    assetMode: assetModes[0] ?? "",
    copyPreview: payload.initialDraft ?? EMPTY_COPY_PLACEHOLDER,
    commandPreview: payload.commandPreview ?? "",
    banner: payload.banner ?? "",
    suggestion: payload.suggestion ?? "",
    jobs,
    selectedJobId: pickRelevantJobId(jobs, scenario?.key ?? ""),
  };
}
