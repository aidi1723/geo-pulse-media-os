import { URL } from "node:url";
import packageJson from "../package.json" with { type: "json" };
import {
  addJobNote,
  applyJobAction,
  buildJobBuckets,
  createBootstrapPayload,
  createDistributionJob,
  createGenerationJob,
  createTopicRefreshJob,
  createWorkflowBundle,
  ensureGenerationInput,
  enrichJob,
  getJobById,
  getScenarioByKey,
  getTopicsForScenario,
} from "./domain.mjs";
import { ApiError, readBody, sendError, sendJson } from "./http.mjs";
import * as defaultStateStore from "./state-store.mjs";

const ROUTER_URL_BASE = "http://localhost";

function findTopic(state, scenarioKey, topicId) {
  return getTopicsForScenario(state, scenarioKey).find((item) => item.id === topicId) ?? null;
}

export async function handleRequest(request, response, dependencies = {}) {
  const stateStore = dependencies.stateStore ?? defaultStateStore;

  if (!request.url) {
    sendError(response, 404, "Not found");
    return;
  }

  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true });
    return;
  }

  const url = new URL(request.url, ROUTER_URL_BASE);

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        status: "ok",
        date: new Date().toISOString(),
        service: "geo-pulse-api",
        version: packageJson.version,
        state: "ready",
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/readiness") {
      try {
        const state = await stateStore.checkReadiness();
        sendJson(response, 200, {
          status: "ready",
          date: new Date().toISOString(),
          service: "geo-pulse-api",
          version: packageJson.version,
          state,
        });
      } catch (error) {
        sendJson(response, 503, {
          status: "not_ready",
          date: new Date().toISOString(),
          service: "geo-pulse-api",
          version: packageJson.version,
          state: {
            readable: false,
            error: error instanceof Error ? error.message : "Unknown readiness error",
          },
        });
      }
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      const rawScenarioKey = url.searchParams.get("scenario");
      const scenarioKey = rawScenarioKey
        ? getScenarioByKey(rawScenarioKey, { strict: true }).key
        : getScenarioByKey().key;
      const state = await stateStore.readState();
      sendJson(response, 200, createBootstrapPayload(state, scenarioKey));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/jobs") {
      const state = await stateStore.readState();
      sendJson(response, 200, buildJobBuckets(state));
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/jobs/")) {
      const state = await stateStore.readState();
      const jobId = url.pathname.replace("/api/jobs/", "");
      const job = getJobById(state, jobId);

      if (!job) {
        sendError(response, 404, "Job not found");
        return;
      }

      sendJson(response, 200, enrichJob(job));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/scenario") {
      const body = await readBody(request);
      const scenario = getScenarioByKey(body.scenarioKey, { strict: true });
      const state = await stateStore.readState();
      const topics = getTopicsForScenario(state, scenario.key);
      sendJson(response, 200, {
        scenario,
        topics,
        suggestion: "建议先从高商业相关且竞争还没完全拉满的题切入，这比单纯追热搜更稳。",
        commandPreview: scenario.command,
        banner: `行业场景已切换为 ${scenario.name}，已同步更新热点池和策略建议。`,
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/topics/refresh") {
      const body = await readBody(request);
      const scenario = getScenarioByKey(body.scenarioKey, { strict: true });
      const result = await stateStore.updateState((state) => {
        const { topics, job } = createTopicRefreshJob(state, scenario.key);
        return {
          topics,
          job,
          jobs: buildJobBuckets(state),
        };
      });

      sendJson(response, 200, {
        topics: result.topics,
        job: result.job,
        jobs: result.jobs,
        banner: `已刷新 ${scenario.name} 场景热点池，并创建新的选题采集任务。`,
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/workflow") {
      const body = await readBody(request);
      const scenario = getScenarioByKey(body.scenarioKey, { strict: true });
      const result = await stateStore.updateState((state) =>
        createWorkflowBundle(state, scenario.key),
      );

      sendJson(response, 200, {
        banner: `已启动 ${scenario.name} 场景工作流：采集热点 -> 评分选题 -> 生成图文/视频 -> 分发到目标渠道。`,
        status: "自动化任务已入队，下一步建议优先校验封面图、标签和发布时间窗。",
        jobs: result.jobs,
        focusJobId: result.focusJobId,
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/generate") {
      const body = await readBody(request);
      const scenario = getScenarioByKey(body.scenarioKey, { strict: true });
      const result = await stateStore.updateState((state) => {
        const topic = findTopic(state, scenario.key, body.topicId);
        const topicText = ensureGenerationInput({ topic, topicText: body.topicText });
        const { draft, job } = createGenerationJob(state, {
          scenarioKey: scenario.key,
          tone: body.tone,
          topic,
          topicText,
          assetMode: body.assetMode,
        });
        return {
          ...draft,
          job,
          jobs: buildJobBuckets(state),
        };
      });

      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/distribution/schedule") {
      const body = await readBody(request);
      const scenario = getScenarioByKey(body.scenarioKey, { strict: true });
      const result = await stateStore.updateState((state) => {
        const { job } = createDistributionJob(state, scenario.key);
        return {
          job,
          jobs: buildJobBuckets(state),
        };
      });

      sendJson(response, 200, {
        banner: `已为 ${scenario.name} 场景创建发布任务，系统将先校验平台权限、素材完整性和定时窗口。`,
        queuedJobs: 4,
        job: result.job,
        jobs: result.jobs,
      });
      return;
    }

    if (request.method === "POST" && url.pathname.startsWith("/api/jobs/")) {
      const segments = url.pathname.split("/");
      const jobId = segments[3];
      const actionSegment = segments[4];
      const body = await readBody(request);

      if (!jobId) {
        throw new ApiError(404, "Job not found");
      }

      if (actionSegment === "action") {
        const result = await stateStore.updateState((state) => {
          const job = applyJobAction(state, jobId, body.action, body.note ?? "");

          if (!job) {
            throw new ApiError(404, "Job not found");
          }

          return {
            job,
            jobs: buildJobBuckets(state),
          };
        });

        sendJson(response, 200, {
          job: result.job,
          jobs: result.jobs,
          banner: `任务“${result.job.label}”已执行动作：${body.action}`,
        });
        return;
      }

      if (actionSegment === "note") {
        const result = await stateStore.updateState((state) => {
          const job = addJobNote(state, jobId, body.note ?? "");

          if (!job) {
            throw new ApiError(404, "Job not found");
          }

          return {
            job,
            jobs: buildJobBuckets(state),
          };
        });

        sendJson(response, 200, {
          job: result.job,
          jobs: result.jobs,
          banner: `任务“${result.job.label}”已新增备注。`,
        });
        return;
      }
    }

    sendError(response, 404, "Not found");
  } catch (error) {
    sendError(response, error);
  }
}
