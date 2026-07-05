export function createJobActions({ services, workspace, ui, getState }) {
  async function saveNote() {
    const { selectedJobId, jobNoteDraft } = getState();
    const note = jobNoteDraft.trim();

    if (!selectedJobId || !note) {
      return;
    }

    ui.setJobActionBusy("note");
    try {
      const result = await services.addJobNote(selectedJobId, note);
      workspace.setSelectedJob(result.job);
      workspace.setJobs(result.jobs);
      workspace.setBanner(result.banner);
      ui.setJobNoteDraft("");
      ui.setAppError("");
    } catch (error) {
      ui.setAppError(error.message);
    } finally {
      ui.setJobActionBusy("");
    }
  }

  async function runAction(action) {
    const { selectedJobId, jobNoteDraft } = getState();

    if (!selectedJobId) {
      return;
    }

    ui.setJobActionBusy(action);
    try {
      const result = await services.runJobAction(selectedJobId, action, jobNoteDraft.trim());
      workspace.setSelectedJob(result.job);
      workspace.setJobs(result.jobs);
      workspace.setBanner(result.banner);
      ui.setHighlightedChannelNames([]);
      ui.setJobNoteDraft("");
      ui.setAppError("");
    } catch (error) {
      ui.setAppError(error.message);
    } finally {
      ui.setJobActionBusy("");
    }
  }

  return {
    saveNote,
    runAction,
  };
}
