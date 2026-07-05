function readImportMetaEnv() {
  try {
    return import.meta.env ?? {};
  } catch {
    return {};
  }
}

export function normalizeApiBaseUrl(value = "") {
  return String(value).trim().replace(/\/+$/, "");
}

export function createRuntimeConfig(env = readImportMetaEnv()) {
  return {
    apiBaseUrl: normalizeApiBaseUrl(env.VITE_API_BASE_URL ?? ""),
  };
}

export const runtimeConfig = createRuntimeConfig();

export function buildApiUrl(path, config = runtimeConfig) {
  const normalizedPath = String(path).startsWith("/") ? String(path) : `/${path}`;

  if (!config.apiBaseUrl) {
    return normalizedPath;
  }

  return `${config.apiBaseUrl}${normalizedPath}`;
}
