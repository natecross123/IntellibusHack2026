/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface BreachRow {
  source: string;
  date: string;
  records: string;
}

export interface MonitoredAccount {
  email: string;
  score: number;
  breaches: number;
  riskLabel: string;
  exposedData: string[];
  recentBreaches: BreachRow[];
  addedAt: string;
  lastCheckedAt: string;
}

interface LookupResult {
  score: number;
  breaches: number;
  exposedData: string[];
  recentBreaches: BreachRow[];
}

interface BreachApiItem {
  name?: string;
  breach_date?: string;
  data_classes?: string[];
}

interface BreachApiResponse {
  breach_count?: number;
  breaches?: BreachApiItem[];
  risk_score?: number;
  risk_label?: string;
}

interface MonitoredAccountApiResponse {
  email: string;
  score: number;
  breaches: number;
  risk_label: string;
  exposed_data: string[];
  recent_breaches: BreachRow[];
  added_at: string;
  last_checked_at: string;
}

interface MonitoredAccountsContextType {
  accounts: MonitoredAccount[];
  isLoading: boolean;
  lookupAccount: (email: string) => Promise<LookupResult>;
  addMonitoredAccount: (email: string) => Promise<{ ok: boolean; error?: string; account?: MonitoredAccount }>;
  removeMonitoredAccount: (email: string) => void;
}

const MonitoredAccountsContext = createContext<MonitoredAccountsContextType | undefined>(undefined);

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

const parseDate = (isoDate: string): string => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toISOString().split("T")[0];
};

const toLookupResult = (data: BreachApiResponse): LookupResult => {
  const breaches = Array.isArray(data?.breaches) ? data.breaches : [];

  const exposedData: string[] = Array.from(
    new Set(
      breaches.flatMap((b: BreachApiItem) => (Array.isArray(b?.data_classes) ? b.data_classes : [])),
    ),
  );

  const recentBreaches = breaches.slice(0, 3).map((b: BreachApiItem) => ({
    source: b?.name ?? "Unknown source",
    date: parseDate(b?.breach_date ?? "Unknown"),
    records: "Unknown",
  }));

  return {
    score: typeof data?.risk_score === "number" ? data.risk_score : 0,
    breaches: typeof data?.breach_count === "number" ? data.breach_count : breaches.length,
    exposedData,
    recentBreaches,
  };
};

const toMonitoredAccount = (data: MonitoredAccountApiResponse): MonitoredAccount => ({
  email: data.email,
  score: data.score,
  breaches: data.breaches,
  riskLabel: data.risk_label,
  exposedData: Array.isArray(data.exposed_data) ? data.exposed_data : [],
  recentBreaches: Array.isArray(data.recent_breaches) ? data.recent_breaches : [],
  addedAt: data.added_at,
  lastCheckedAt: data.last_checked_at,
});

const fetchLookup = async (email: string): Promise<LookupResult> => {
  const response = await fetch(apiUrl("/api/breach/check"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(`Lookup request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as BreachApiResponse;
  return toLookupResult(payload);
};

export const MonitoredAccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [accounts, setAccounts] = useState<MonitoredAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const authHeaders = useMemo(() => {
    if (!accessToken) return null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
  }, [accessToken]);

  const refreshAccounts = useCallback(async () => {
    if (!user || !authHeaders) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl("/api/user/monitored-accounts"), {
        method: "GET",
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error(`Unable to load monitored accounts (${response.status})`);
      }

      const payload = (await response.json()) as MonitoredAccountApiResponse[];
      setAccounts(Array.isArray(payload) ? payload.map(toMonitoredAccount) : []);
    } catch {
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, authHeaders]);

  useEffect(() => {
    setIsLoading(true);
    void refreshAccounts();
  }, [refreshAccounts]);

  const lookupAccount = useCallback(async (email: string) => {
    return fetchLookup(email.trim().toLowerCase());
  }, []);

  const addMonitoredAccount = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { ok: false, error: "Please provide an email to monitor." };
    }

    if (!authHeaders) {
      return { ok: false, error: "You must be logged in to monitor accounts." };
    }

    if (accounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, error: "That account is already being monitored." };
    }

    try {
      const response = await fetch(apiUrl("/api/user/monitored-accounts"), {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!response.ok) {
        const payload = await response.json();
        return { ok: false, error: payload?.detail ?? "Unable to monitor account." };
      }

      const payload = (await response.json()) as MonitoredAccountApiResponse;
      const monitoredAccount = toMonitoredAccount(payload);
      setAccounts((prev) => [monitoredAccount, ...prev.filter((a) => a.email !== monitoredAccount.email)]);
      return { ok: true, account: monitoredAccount };
    } catch {
      return { ok: false, error: "Unable to monitor account." };
    }
  }, [accounts, authHeaders]);

  const removeMonitoredAccount = useCallback((email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    setAccounts((prev) => prev.filter((a) => a.email.toLowerCase() !== normalizedEmail));

    if (!authHeaders) return;

    void fetch(apiUrl(`/api/user/monitored-accounts/${encodeURIComponent(normalizedEmail)}`), {
      method: "DELETE",
      headers: authHeaders,
    });
  }, [authHeaders]);

  const value = useMemo(
    () => ({ accounts, isLoading, lookupAccount, addMonitoredAccount, removeMonitoredAccount }),
    [accounts, isLoading, lookupAccount, addMonitoredAccount, removeMonitoredAccount],
  );

  return (
    <MonitoredAccountsContext.Provider value={value}>
      {children}
    </MonitoredAccountsContext.Provider>
  );
};

export const useMonitoredAccounts = () => {
  const ctx = useContext(MonitoredAccountsContext);
  if (!ctx) {
    throw new Error("useMonitoredAccounts must be used within MonitoredAccountsProvider");
  }
  return ctx;
};
