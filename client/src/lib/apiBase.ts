const sanitizeBase = (value?: string | null): string => (value ?? "").trim().replace(/\/$/, "");

const isLocalHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
};

export const getApiBaseUrl = (): string => {
  const fromEnv = sanitizeBase(import.meta.env.VITE_API_BASE_URL);
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined" && isLocalHost(window.location.hostname)) {
    return "http://localhost:8000";
  }

  return "";
};

export const apiUrl = (path: string): string => `${getApiBaseUrl()}${path}`;
