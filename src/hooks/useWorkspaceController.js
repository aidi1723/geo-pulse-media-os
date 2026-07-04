import { useState } from "react";
import {
  applyWorkspacePayloadToState,
  createInitialWorkspaceState,
} from "../state/workspaceState.js";

export function useWorkspaceController(defaults) {
  const [workspace, setWorkspace] = useState(() => createInitialWorkspaceState(defaults));

  function patchWorkspace(patch) {
    setWorkspace((current) => ({
      ...current,
      ...(typeof patch === "function" ? patch(current) : patch),
    }));
  }

  function applyWorkspacePayload(payload, bannerOverride = payload.banner) {
    setWorkspace((current) =>
      applyWorkspacePayloadToState(current, payload, defaults, bannerOverride),
    );
  }

  return {
    workspace,
    applyWorkspacePayload,
    setSelectedTopic: (selectedTopic) => patchWorkspace({ selectedTopic }),
    setTone: (tone) => patchWorkspace({ tone }),
    setAssetMode: (assetMode) => patchWorkspace({ assetMode }),
    setCopyPreview: (copyPreview) => patchWorkspace({ copyPreview }),
    setCommandPreview: (commandPreview) => patchWorkspace({ commandPreview }),
    setBanner: (banner) => patchWorkspace({ banner }),
    setSuggestion: (suggestion) => patchWorkspace({ suggestion }),
    setTopics: (topics) => patchWorkspace({ topics }),
    setJobs: (jobs) => patchWorkspace({ jobs }),
    setSelectedJobId: (selectedJobId) => patchWorkspace({ selectedJobId }),
  };
}
