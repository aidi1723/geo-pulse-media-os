export function filterJobBuckets(jobs, scenarioKey, scope) {
  if (scope === "all") {
    return jobs;
  }

  const isVisible = (job) => job.scenarioKey === scenarioKey;

  return {
    topicIngestion: jobs.topicIngestion.filter(isVisible),
    generation: jobs.generation.filter(isVisible),
    distribution: jobs.distribution.filter(isVisible),
  };
}

function flattenJobIds(jobs) {
  return [
    ...jobs.topicIngestion.map((job) => job.id),
    ...jobs.generation.map((job) => job.id),
    ...jobs.distribution.map((job) => job.id),
  ];
}

export function resolveSelectedJobId(jobs, scenarioKey, scope, selectedJobId) {
  const visibleJobs = filterJobBuckets(jobs, scenarioKey, scope);
  const visibleIds = flattenJobIds(visibleJobs);

  if (visibleIds.includes(selectedJobId)) {
    return selectedJobId;
  }

  return visibleIds[0] ?? "";
}
