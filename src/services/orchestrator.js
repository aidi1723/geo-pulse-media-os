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

async function request(path, options = {}) {
  const response = await fetch(path, {
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

export function getBootstrapData(scenarioKey) {
  const suffix = scenarioKey ? `?scenario=${encodeURIComponent(scenarioKey)}` : "";
  return request(`/api/bootstrap${suffix}`);
}

export function getJobs() {
  return request("/api/jobs");
}

export function getJobDetail(jobId) {
  return request(`/api/jobs/${jobId}`);
}

export function runJobAction(jobId, action, note = "") {
  return request(`/api/jobs/${jobId}/action`, {
    method: "POST",
    body: JSON.stringify({ action, note }),
  });
}

export function addJobNote(jobId, note) {
  return request(`/api/jobs/${jobId}/note`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export function runWorkflow(scenarioKey) {
  return request("/api/workflow", {
    method: "POST",
    body: JSON.stringify({ scenarioKey }),
  });
}

export function switchScenario(scenarioKey) {
  return request("/api/scenario", {
    method: "POST",
    body: JSON.stringify({ scenarioKey }),
  });
}

export function refreshTopics(scenarioKey) {
  return request("/api/topics/refresh", {
    method: "POST",
    body: JSON.stringify({ scenarioKey }),
  });
}

export function generateDraft({ tone, topicId, topicText, assetMode, scenarioKey }) {
  return request("/api/generate", {
    method: "POST",
    body: JSON.stringify({ tone, topicId, topicText, assetMode, scenarioKey }),
  });
}

export function scheduleDistribution({ scenarioKey }) {
  return request("/api/distribution/schedule", {
    method: "POST",
    body: JSON.stringify({ scenarioKey }),
  });
}
