import { randomUUID } from "node:crypto";
import {
  assetModes,
  automationRail,
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
} from "../src/data/mockData.js";
import { ApiError } from "./http.mjs";

const SEED_TIMESTAMPS = {
  ingestionCreatedAt: "2026-04-17T00:30:00.000Z",
  ingestionCompletedAt: "2026-04-17T00:35:00.000Z",
  generationCreatedAt: "2026-04-17T00:50:00.000Z",
  generationCompletedAt: "2026-04-17T00:55:00.000Z",
  distributionCreatedAt: "2026-04-17T01:10:00.000Z",
};

const scenarioDraftContext = {
  "consumer-tech": {
    audience: "内容创业者和个人工作室",
    proofPoint: "真实体验、效率提升和投入产出比",
    assetFocus: "评测图文、长文拆解和 30 秒脚本",
    ctaKeyword: "工作流",
  },
  beauty: {
    audience: "敏感肌和成分党用户",
    proofPoint: "成分安全、肤感反馈和真实修护周期",
    assetFocus: "种草图文、对比清单和口播短视频",
    ctaKeyword: "维稳",
  },
  education: {
    audience: "升学和职业成长用户",
    proofPoint: "路径清晰度、执行成本和长期复利",
    assetFocus: "路线图长文、讲解提纲和私域承接素材",
    ctaKeyword: "路线图",
  },
};

function nowIso() {
  return new Date().toISOString();
}

function createHistoryEntry(action, note) {
  return {
    id: randomUUID(),
    action,
    note: note ?? "",
    actor: "system",
    createdAt: nowIso(),
  };
}

function createSeedHistoryEntry(id, action, note, createdAt) {
  return {
    id,
    action,
    note,
    actor: "system",
    createdAt,
  };
}

function ensureJobMeta(job) {
  return {
    ...job,
    notes: job.notes ?? [],
    history: job.history ?? [],
    payload: job.payload ?? {},
    reviewComment: job.reviewComment ?? "",
    artifact: job.artifact ?? createArtifactFromJob(job),
  };
}

function createArtifactFromJob(job) {
  if (job.kind === "generation") {
    return {
      type: "copy_draft",
      title: job.payload?.topicTitle ?? "未命名草稿",
      tone: job.payload?.tone ?? "",
      assetMode: job.payload?.assetMode ?? "",
      content:
        job.payload?.fullDraft ??
        job.payload?.preview ??
        "当前任务尚未保存完整草稿内容。",
    };
  }

  if (job.kind === "distribution") {
    return {
      type: "distribution_plan",
      title: job.payload?.scenarioName ?? "发布排期",
      channels:
        job.payload?.schedules ??
        [
          {
            name: "默认渠道",
            schedule: "待排期",
          },
        ],
    };
  }

  if (job.kind === "topic_ingestion") {
    return {
      type: "topic_refresh",
      title: "热点池刷新结果",
      refreshedTopics: job.payload?.refreshedTopics ?? 0,
      summary: job.resultSummary ?? "暂无摘要",
    };
  }

  return {
    type: "generic",
    title: job.label,
    summary: job.resultSummary ?? "暂无产物信息",
  };
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getToneNames() {
  return Object.keys(toneVariants);
}

export function getScenarioByKey(key, options = {}) {
  const scenario = scenarios.find((item) => item.key === key);

  if (scenario) {
    return scenario;
  }

  if (options.strict) {
    throw new ApiError(400, `Unknown scenario: ${key}`);
  }

  return scenarios[0];
}

export function getTopicsForScenario(state, scenarioKey) {
  return state.scenarioTopics[scenarioKey] ?? clone(topicsByScenario[scenarios[0].key]);
}

export function ensureGenerationInput({ topic, topicText }) {
  if (topicText != null && typeof topicText !== "string") {
    throw new ApiError(400, "选题内容必须是文本");
  }

  const normalizedTopicText = topicText?.trim() ?? "";

  if (topic || normalizedTopicText) {
    return normalizedTopicText;
  }

  throw new ApiError(400, "请先输入核心选题");
}

function parseTopicText(topicText = "") {
  const [title = "", summary = "", angle = ""] = topicText
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return { title, summary, angle };
}

function normalizeAngle(angle = "") {
  return angle.replace(/^机会点[:：]\s*/, "").trim();
}

function getScenarioDraftMeta(scenarioKey) {
  return scenarioDraftContext[scenarioKey] ?? scenarioDraftContext["consumer-tech"];
}

function buildXiaohongshuDraft({ title, summary, angle, scenarioMeta, assetMode }) {
  return `标题：
${title}

正文：
最近讨论「${title}」的人，真正会留下来的原因不是概念有多新，而是它是否回答了 ${scenarioMeta.audience} 最在意的问题。
1. 先把 ${summary} 讲清楚，别让读者自己猜重点。
2. 围绕「${normalizeAngle(angle)}」给出更具体的判断，这会比空泛观点更容易转化。
3. 生成时同步准备 ${assetMode}，方便后续一稿多端复用。

结尾 CTA：
如果你想把这类题继续拆成 ${scenarioMeta.assetFocus}，评论区留“${scenarioMeta.ctaKeyword}”。`;
}

function buildZhihuDraft({ title, summary, angle, scenarioMeta, assetMode }) {
  return `问题背景：
围绕「${title}」的讨论，本质上是在验证这类内容是否能持续满足 ${scenarioMeta.audience} 对 ${scenarioMeta.proofPoint} 的需求。

核心判断：
1. 议题价值：${summary}
2. 切入方式：优先围绕「${normalizeAngle(angle)}」组织结构，而不是简单复述热点。
3. 产物规划：先完成 ${assetMode}，再拆成长文和短内容，形成更稳定的内容资产。

建议结构：
先给出场景判断，再补充方法论和执行建议，最后引导读者进入 ${scenarioMeta.assetFocus} 的后续内容链路。`;
}

function buildDouyinDraft({ title, summary, angle, scenarioMeta, assetMode }) {
  return `开场 3 秒：
如果你也在看「${title}」，先别急着下结论，最该看的其实是 ${scenarioMeta.proofPoint}。

中段节奏：
第一，直接点出 ${summary}
第二，用「${normalizeAngle(angle)}」做主要记忆点。
第三，顺手告诉观众这条内容还能继续延展成 ${assetMode}。

结尾动作：
想看我把这个题继续拆成 ${scenarioMeta.assetFocus}，评论区留“${scenarioMeta.ctaKeyword}”。`;
}

function composeDraftContent({ tone, title, summary, angle, scenarioMeta, assetMode }) {
  if (tone === "知乎专业评测风") {
    return buildZhihuDraft({ title, summary, angle, scenarioMeta, assetMode });
  }

  if (tone === "抖音快节奏脚本风") {
    return buildDouyinDraft({ title, summary, angle, scenarioMeta, assetMode });
  }

  return buildXiaohongshuDraft({ title, summary, angle, scenarioMeta, assetMode });
}

export function buildDraft({ scenarioKey, tone, topic, topicText, assetMode }) {
  const fallbackTopic = parseTopicText(topicText);
  const topicTitle = topic?.title ?? fallbackTopic.title ?? "未命名选题";
  const topicSummary = topic?.summary ?? fallbackTopic.summary ?? "请补充选题摘要和核心判断。";
  const topicAngle = topic?.angle ?? fallbackTopic.angle ?? "机会点：补充差异化切入。";
  const scenarioMeta = getScenarioDraftMeta(scenarioKey);
  const content = composeDraftContent({
    tone,
    title: topicTitle,
    summary: topicSummary,
    angle: topicAngle,
    scenarioMeta,
    assetMode,
  });

  return {
    content,
    status: `已根据 ${tone} 生成 ${getScenarioByKey(scenarioKey).name} 场景草稿，并附带 ${assetMode} 的任务参数。`,
  };
}

function getAvailableActions(job) {
  const actions = ["retry"];

  if (job.status === "queued" || job.status === "running") {
    actions.push("cancel");
  }

  if (job.reviewStatus === "pending_review") {
    actions.push("approve", "reject");
  }

  if (job.status === "failed" || job.status === "canceled") {
    return ["retry"];
  }

  return actions;
}

function isActionAllowed(job, action) {
  return getAvailableActions(job).includes(action);
}

export function enrichJob(job) {
  if (!job) {
    return null;
  }

  const fullJob = ensureJobMeta(job);

  return {
    ...fullJob,
    actions: getAvailableActions(fullJob),
  };
}

function buildSeedJobs() {
  const seedGenerationDraft = buildDraft({
    scenarioKey: "consumer-tech",
    tone: "小红书种草风",
    topic: topicsByScenario["consumer-tech"][0],
    topicText: `${topicsByScenario["consumer-tech"][0].title}\n\n${topicsByScenario["consumer-tech"][0].summary}\n\n${topicsByScenario["consumer-tech"][0].angle}`,
    assetMode: "图文封面 + 正文排版",
  });

  return {
    topicIngestion: [
      {
        id: "seed-ingestion-01",
        scenarioKey: "consumer-tech",
        kind: "topic_ingestion",
        status: "completed",
        reviewStatus: "not_required",
        label: "热点池初始采集",
        detail: "聚合小红书、知乎、Reddit、B 站与 YouTube 热点。",
        createdAt: SEED_TIMESTAMPS.ingestionCreatedAt,
        completedAt: SEED_TIMESTAMPS.ingestionCompletedAt,
        payload: {
          refreshedTopics: 4,
        },
        resultSummary: "初始化热点池已就绪。",
        notes: [
          {
            id: "seed-note-ingestion-01",
            text: "系统已完成首轮热点采集。",
            author: "system",
            createdAt: SEED_TIMESTAMPS.ingestionCompletedAt,
          },
        ],
        history: [
          createSeedHistoryEntry(
            "seed-history-ingestion-01",
            "created",
            "任务已初始化",
            SEED_TIMESTAMPS.ingestionCreatedAt,
          ),
        ],
      },
    ],
    generation: [
      {
        id: "seed-generation-01",
        scenarioKey: "consumer-tech",
        kind: "generation",
        status: "completed",
        reviewStatus: "pending_review",
        label: "图文初版生成",
        detail: "小红书种草风 + 图文封面 + 正文排版",
        createdAt: SEED_TIMESTAMPS.generationCreatedAt,
        completedAt: SEED_TIMESTAMPS.generationCompletedAt,
        payload: {
          tone: "小红书种草风",
          assetMode: "图文封面 + 正文排版",
          topicTitle: "AI 硬件是不是新一轮内容创业的流量入口？",
          fullDraft: seedGenerationDraft.content,
        },
        resultSummary: "种草稿件已生成，待审核。",
        notes: [],
        history: [
          createSeedHistoryEntry(
            "seed-history-generation-01",
            "created",
            "已生成第一版草稿",
            SEED_TIMESTAMPS.generationCreatedAt,
          ),
        ],
        reviewComment: "",
      },
    ],
    distribution: [
      {
        id: "seed-distribution-01",
        scenarioKey: "consumer-tech",
        kind: "distribution",
        status: "queued",
        reviewStatus: "pending_review",
        label: "首轮矩阵分发",
        detail: `已排队 ${distributionChannels.length} 个渠道任务`,
        createdAt: SEED_TIMESTAMPS.distributionCreatedAt,
        payload: {
          channels: distributionChannels.length,
          scenarioName: "消费科技",
          schedules: distributionChannels.map((channel) => ({
            name: channel.name,
            schedule: channel.schedule,
            asset: channel.copy,
          })),
        },
        resultSummary: "等待审核通过后开始发布。",
        notes: [],
        history: [
          createSeedHistoryEntry(
            "seed-history-distribution-01",
            "created",
            "发布任务已进入待审核状态",
            SEED_TIMESTAMPS.distributionCreatedAt,
          ),
        ],
        reviewComment: "",
      },
    ],
  };
}

export function createInitialState() {
  return {
    version: 1,
    updatedAt: SEED_TIMESTAMPS.distributionCreatedAt,
    scenarioTopics: clone(topicsByScenario),
    jobs: buildSeedJobs(),
  };
}

export function buildJobBuckets(state, limit = 8) {
  return {
    topicIngestion: state.jobs.topicIngestion.slice(0, limit).map(enrichJob),
    generation: state.jobs.generation.slice(0, limit).map(enrichJob),
    distribution: state.jobs.distribution.slice(0, limit).map(enrichJob),
  };
}

export function getAllJobs(state) {
  return [
    ...state.jobs.topicIngestion.map((job) => ({ ...ensureJobMeta(job), bucket: "topicIngestion" })),
    ...state.jobs.generation.map((job) => ({ ...ensureJobMeta(job), bucket: "generation" })),
    ...state.jobs.distribution.map((job) => ({ ...ensureJobMeta(job), bucket: "distribution" })),
  ];
}

export function getJobById(state, jobId) {
  return getAllJobs(state).find((job) => job.id === jobId) ?? null;
}

export function createBootstrapPayload(state, scenarioKey) {
  const scenario = getScenarioByKey(scenarioKey);
  const topics = getTopicsForScenario(state, scenario.key);
  const tones = getToneNames();
  const initialDraft = buildDraft({
    scenarioKey: scenario.key,
    tone: tones[0],
    topic: topics[0],
    topicText: topics[0] ? `${topics[0].title}\n\n${topics[0].summary}\n\n${topics[0].angle}` : "",
    assetMode: assetModes[0],
  });

  return {
    navItems,
    metrics,
    scenarios,
    scenario,
    topics,
    tones,
    assetModes,
    timelineSteps,
    distributionChannels,
    securityItems,
    automationRail,
    platformModules,
    suggestion: suggestions.overview,
    commandPreview: scenario.command,
    banner: "本地 API 已连接，任务状态与热点池已由后端接管。",
    initialDraft: initialDraft.content,
    jobs: buildJobBuckets(state, 5),
  };
}

export function createTopicRefreshJob(state, scenarioKey) {
  const now = nowIso();
  const topics = getTopicsForScenario(state, scenarioKey).map((topic, index) => ({
    ...topic,
    heat: `热度 ${Math.max(70, 95 - index * 4)}`,
    tags: Array.from(new Set([...topic.tags, "刚刷新"])).slice(0, 3),
  }));
  const job = {
    id: randomUUID(),
    scenarioKey,
    kind: "topic_ingestion",
    status: "completed",
    reviewStatus: "not_required",
    label: "热点池刷新完成",
    detail: `已重排 ${topics.length} 条候选选题，并更新热度标签。`,
    createdAt: now,
    completedAt: now,
    payload: {
      refreshedTopics: topics.length,
    },
    resultSummary: "热点热度已重排，可直接进入创作舱。",
    notes: [],
    history: [createHistoryEntry("created", "系统完成热点刷新")],
    reviewComment: "",
  };

  state.scenarioTopics[scenarioKey] = topics;
  state.jobs.topicIngestion.unshift(job);
  state.jobs.topicIngestion = state.jobs.topicIngestion.slice(0, 12);
  state.updatedAt = now;

  return { topics, job: enrichJob(job) };
}

export function createGenerationJob(state, { scenarioKey, tone, topic, topicText, assetMode }) {
  const now = nowIso();
  const normalizedTopicText = ensureGenerationInput({ topic, topicText });
  const draft = buildDraft({
    scenarioKey,
    tone,
    topic,
    topicText: normalizedTopicText,
    assetMode,
  });
  const topicTitle = topic?.title ?? normalizedTopicText.split("\n")[0] ?? "未命名选题";
  const job = {
    id: randomUUID(),
    scenarioKey,
    kind: "generation",
    status: "completed",
    reviewStatus: "pending_review",
    label: "生成任务完成",
    detail: `${tone} / ${assetMode} / ${topicTitle}`,
    createdAt: now,
    completedAt: now,
    payload: {
      tone,
      assetMode,
      topicTitle,
      preview: draft.content.slice(0, 220),
      fullDraft: draft.content,
    },
    resultSummary: "草稿已生成，建议先审核语气、标题与 CTA。",
    notes: [],
    history: [createHistoryEntry("created", "系统已完成草稿生成")],
    reviewComment: "",
  };

  state.jobs.generation.unshift(job);
  state.jobs.generation = state.jobs.generation.slice(0, 12);
  state.updatedAt = now;

  return { job: enrichJob(job), draft };
}

export function createDistributionJob(state, scenarioKey) {
  const now = nowIso();
  const scenario = getScenarioByKey(scenarioKey);
  const job = {
    id: randomUUID(),
    scenarioKey,
    kind: "distribution",
    status: "queued",
    reviewStatus: "pending_review",
    label: "发布任务已排队",
    detail: `${scenario.name} 场景已排入 ${distributionChannels.length} 个渠道任务`,
    createdAt: now,
    payload: {
      channels: distributionChannels.length,
      scenarioName: scenario.name,
      schedules: distributionChannels.map((channel) => ({
        name: channel.name,
        schedule: channel.schedule,
        asset: channel.copy,
      })),
    },
    resultSummary: "等待审核通过后即可进入发布执行。",
    notes: [],
    history: [createHistoryEntry("created", "发布任务已进入排队状态")],
    reviewComment: "",
  };

  state.jobs.distribution.unshift(job);
  state.jobs.distribution = state.jobs.distribution.slice(0, 12);
  state.updatedAt = now;

  return { job: enrichJob(job) };
}

export function createWorkflowEvent(state, scenarioKey) {
  const now = nowIso();
  const scenario = getScenarioByKey(scenarioKey);
  const job = {
    id: randomUUID(),
    scenarioKey,
    kind: "workflow",
    status: "queued",
    reviewStatus: "not_required",
    label: "工作流已启动",
    detail: `${scenario.name} 场景进入自动化编排队列`,
    createdAt: now,
    payload: {
      scenarioName: scenario.name,
    },
    resultSummary: "系统将继续生成后续子任务。",
    notes: [],
    history: [createHistoryEntry("created", "工作流主任务已建立")],
    reviewComment: "",
  };

  state.jobs.topicIngestion.unshift(job);
  state.jobs.topicIngestion = state.jobs.topicIngestion.slice(0, 12);
  state.updatedAt = now;

  return { job: enrichJob(job) };
}

export function createWorkflowBundle(state, scenarioKey) {
  const now = nowIso();
  const scenario = getScenarioByKey(scenarioKey);
  const { topics, job: topicJob } = createTopicRefreshJob(state, scenario.key);
  const topTopic = topics[0] ?? null;
  const defaultTone = getToneNames()[0];
  const defaultAssetMode = assetModes[0];
  const { job: generationJob } = createGenerationJob(state, {
    scenarioKey: scenario.key,
    tone: defaultTone,
    topic: topTopic,
    topicText: topTopic
      ? `${topTopic.title}\n\n${topTopic.summary}\n\n${topTopic.angle}`
      : "",
    assetMode: defaultAssetMode,
  });
  const { job: distributionJob } = createDistributionJob(state, scenario.key);
  const workflowJob = {
    id: randomUUID(),
    scenarioKey,
    kind: "workflow",
    status: "queued",
    reviewStatus: "not_required",
    label: "工作流已启动",
    detail: `${scenario.name} 场景已创建选题、生成与分发任务`,
    createdAt: now,
    payload: {
      scenarioName: scenario.name,
      childJobIds: {
        topicIngestion: topicJob.id,
        generation: generationJob.id,
        distribution: distributionJob.id,
      },
    },
    resultSummary: "系统已创建后续任务，建议先审核生成稿，再决定是否放行分发。",
    notes: [],
    history: [createHistoryEntry("created", "工作流编排已拆分为后续任务")],
    reviewComment: "",
  };

  state.jobs.topicIngestion.unshift(workflowJob);
  state.jobs.topicIngestion = state.jobs.topicIngestion.slice(0, 12);
  state.updatedAt = now;

  return {
    job: enrichJob(workflowJob),
    jobs: buildJobBuckets(state),
    focusJobId: generationJob.id,
  };
}

export function addJobNote(state, jobId, note) {
  const now = nowIso();

  if (typeof note !== "string") {
    throw new ApiError(400, "备注必须是文本");
  }

  const normalizedNote = note.trim();
  const buckets = ["topicIngestion", "generation", "distribution"];
  let updatedJob = null;

  if (!normalizedNote) {
    throw new ApiError(400, "备注不能为空");
  }

  for (const bucket of buckets) {
    state.jobs[bucket] = state.jobs[bucket].map((job) => {
      if (job.id !== jobId) {
        return ensureJobMeta(job);
      }

      const nextJob = ensureJobMeta(job);
      nextJob.notes = [
        {
          id: randomUUID(),
          text: normalizedNote,
          author: "operator",
          createdAt: now,
        },
        ...nextJob.notes,
      ];
      nextJob.history = [
        createHistoryEntry("note_added", normalizedNote),
        ...nextJob.history,
      ];
      nextJob.lastActionAt = now;
      updatedJob = nextJob;
      return nextJob;
    });
  }

  if (!updatedJob) {
    return null;
  }

  state.updatedAt = now;
  return enrichJob(updatedJob);
}

export function applyJobAction(state, jobId, action, note = "") {
  const now = nowIso();
  const buckets = ["topicIngestion", "generation", "distribution"];
  let updatedJob = null;

  for (const bucket of buckets) {
    state.jobs[bucket] = state.jobs[bucket].map((job) => {
      if (job.id !== jobId) {
        return ensureJobMeta(job);
      }

      const nextJob = ensureJobMeta(job);

      if (!isActionAllowed(nextJob, action)) {
        throw new ApiError(409, `Action not allowed: ${action}`);
      }

      if (action === "approve") {
        nextJob.reviewStatus = "approved";
        if (nextJob.kind === "distribution" && nextJob.status === "queued") {
          nextJob.status = "running";
        }
        nextJob.resultSummary = "审核已通过，任务保持可执行状态。";
        nextJob.reviewComment = note || nextJob.reviewComment;
      }

      if (action === "reject") {
        nextJob.reviewStatus = "rejected";
        nextJob.status = "failed";
        nextJob.resultSummary = "任务已驳回，等待重新生成或重新排队。";
        nextJob.reviewComment = note || nextJob.reviewComment;
      }

      if (action === "retry") {
        nextJob.retryCount = (nextJob.retryCount ?? 0) + 1;
        nextJob.reviewStatus =
          nextJob.kind === "topic_ingestion" || nextJob.kind === "workflow"
            ? "not_required"
            : "pending_review";
        nextJob.status = nextJob.kind === "distribution" ? "queued" : "completed";
        nextJob.createdAt = now;
        nextJob.completedAt = nextJob.kind === "distribution" ? undefined : now;
        nextJob.resultSummary = "任务已重试并刷新最新结果。";
        nextJob.detail = `${job.detail} / 已重试 ${nextJob.retryCount} 次`;
      }

      if (action === "cancel") {
        nextJob.status = "canceled";
        nextJob.reviewStatus =
          nextJob.reviewStatus === "pending_review" ? "rejected" : nextJob.reviewStatus;
        nextJob.resultSummary = "任务已取消，不会继续执行。";
      }

      if (note) {
        nextJob.notes = [
          {
            id: randomUUID(),
            text: note,
            author: "operator",
            createdAt: now,
          },
          ...nextJob.notes,
        ];
      }

      nextJob.history = [
        createHistoryEntry(action, note),
        ...nextJob.history,
      ];
      nextJob.lastActionAt = now;
      updatedJob = nextJob;
      return nextJob;
    });
  }

  if (!updatedJob) {
    return null;
  }

  state.updatedAt = now;
  return enrichJob(updatedJob);
}
