import { buildApiUrl, runtimeConfig } from "../config/runtimeConfig.js";

export async function extractErrorMessage(response) {
  const contentType = response.headers.get("Content-Type") ?? "";
  const raw = await response.text();

  if (!raw) {
    return `Request failed: ${response.status}`;
  }

  if (contentType.includes("application/json")) {
    try {
      const payload = JSON.parse(raw);
      if (payload?.error) {
        return payload.error;
      }
      if (payload?.message) {
        return payload.message;
      }
    } catch {
      return raw;
    }
  }

  try {
    const payload = JSON.parse(raw);
    return payload.error || payload.message || `Request failed: ${response.status}`;
  } catch {
    return raw;
  }
}

export function createOrchestratorClient({
  config = runtimeConfig,
  fetchImpl = (...args) => globalThis.fetch(...args),
} = {}) {
  async function request(path, options = {}) {
    const response = await fetchImpl(buildApiUrl(path, config), {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      ...options,
    });

    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message);
    }

    return response.json();
  }

  return {
    getBootstrapData(scenarioKey) {
      const suffix = scenarioKey ? `?scenario=${encodeURIComponent(scenarioKey)}` : "";
      return request(`/api/bootstrap${suffix}`);
    },
    getJobs() {
      return request("/api/jobs");
    },
    getJobDetail(jobId) {
      return request(`/api/jobs/${jobId}`);
    },
    runJobAction(jobId, action, note = "") {
      return request(`/api/jobs/${jobId}/action`, {
        method: "POST",
        body: JSON.stringify({ action, note }),
      });
    },
    addJobNote(jobId, note) {
      return request(`/api/jobs/${jobId}/note`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });
    },
    runWorkflow(scenarioKey) {
      return request("/api/workflow", {
        method: "POST",
        body: JSON.stringify({ scenarioKey }),
      });
    },
    switchScenario(scenarioKey) {
      return request("/api/scenario", {
        method: "POST",
        body: JSON.stringify({ scenarioKey }),
      });
    },
    refreshTopics(scenarioKey) {
      return request("/api/topics/refresh", {
        method: "POST",
        body: JSON.stringify({ scenarioKey }),
      });
    },
    generateDraft({ tone, topicId, topicText, assetMode, scenarioKey }) {
      return request("/api/generate", {
        method: "POST",
        body: JSON.stringify({ tone, topicId, topicText, assetMode, scenarioKey }),
      });
    },
    scheduleDistribution({ scenarioKey }) {
      return request("/api/distribution/schedule", {
        method: "POST",
        body: JSON.stringify({ scenarioKey }),
      });
    },
  };
}

const defaultClient = createOrchestratorClient();

export const getBootstrapData = defaultClient.getBootstrapData;
export const getJobs = defaultClient.getJobs;
export const getJobDetail = defaultClient.getJobDetail;
export const runJobAction = defaultClient.runJobAction;
export const addJobNote = defaultClient.addJobNote;
export const runWorkflow = defaultClient.runWorkflow;
export const switchScenario = defaultClient.switchScenario;
export const refreshTopics = defaultClient.refreshTopics;
export const generateDraft = defaultClient.generateDraft;
export const scheduleDistribution = defaultClient.scheduleDistribution;
