const DEFAULT_API_BASE = "http://localhost:8000";

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;

  if (!fromEnv) {
    console.warn(
      "[config] VITE_API_BASE_URL not set, using default:",
      DEFAULT_API_BASE,
    );
    return DEFAULT_API_BASE;
  }

  // strip trailing slashes so we don't get `//` when joining paths
  return fromEnv.replace(/\/+$/, "");
}

export const APP_NAME = "Secretarybird Guardian Console";
