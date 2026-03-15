import { apiUrl } from "@/lib/apiBase";

const ACCESS_TOKEN_STORAGE_KEY = "cybershield_access_token";

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseJsonOrText = async <T>(response: Response): Promise<T> => {
  const raw = await response.text();
  if (!raw) {
    throw new Error(`Empty response (${response.status})`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(raw);
  }
};

const extractError = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string") {
    return payload.detail;
  }
  return fallback;
};

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init);
  const payload = await parseJsonOrText<T | { detail?: string }>(response);

  if (!response.ok) {
    throw new Error(extractError(payload, `${init.method ?? "GET"} ${path} failed (${response.status})`));
  }

  return payload as T;
}

export interface LinkScanResponse {
  url: string;
  is_safe: boolean;
  risk_score: number;
  risk_label: string;
  google_safe_browsing_flags: string[];
  virustotal?: {
    total_engines: number;
    malicious_count: number;
    suspicious_count: number;
    clean_count: number;
    engine_highlights: string[];
  } | null;
  verdict: string;
  recommendation: string;
}

export interface EmailAnalysisResponse {
  risk_score: number;
  risk_label: string;
  scam_type?: string | null;
  red_flags: Array<{
    flag: string;
    explanation: string;
  }>;
  links_found: string[];
  verdict: string;
  recommendation: string;
}

export interface MediaScanResponse {
  media_type: string;
  filename: string;
  risk_score: number;
  risk_label: string;
  verdict: string;
  recommendation: string;
  ai_generated_score?: number | null;
  deepfake_score?: number | null;
  ai_voice_score?: number | null;
}

export const scanLink = (url: string): Promise<LinkScanResponse> =>
  requestJson<LinkScanResponse>("/api/scan/link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ url }),
  });

export const analyzeEmail = (content: string, sender?: string, subject?: string): Promise<EmailAnalysisResponse> =>
  requestJson<EmailAnalysisResponse>("/api/analyze/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content, sender: sender || undefined, subject: subject || undefined }),
  });

export const scanImageFile = (file: File): Promise<MediaScanResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson<MediaScanResponse>("/api/media/image", {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });
};

export const scanImageUrl = (url: string): Promise<MediaScanResponse> =>
  requestJson<MediaScanResponse>("/api/media/image-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ url }),
  });

export const scanVideoFile = (file: File): Promise<MediaScanResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson<MediaScanResponse>("/api/media/video", {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });
};

export const scanVideoUrl = (url: string): Promise<MediaScanResponse> =>
  requestJson<MediaScanResponse>("/api/media/video-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ url }),
  });