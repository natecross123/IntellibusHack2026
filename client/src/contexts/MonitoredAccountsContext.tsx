/* eslint-disable react-refresh/only-export-components */
import { apiUrl } from "@/lib/apiBase";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

// Shape returned by /api/breach/check (FastAPI BreachResponse schema)
interface BreachApiResponse {
  email?: string;
  breach_count?: number;
  breaches?: Array<{
    name?: string;
    domain?: string;
    breach_date?: string;
    description?: string;
    data_classes?: string[];
  }>;
  risk_score?: number;
  risk_label?: string;
  recovery_plan?: unknown[];
  summary?: string;
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

const parseDate = (isoDate: string): string => {
  if (!isoDate || isoDate === "Unknown") return "Unknown";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toISOString().split("T")[0];
};

const toLookupResult = (data: BreachApiResponse): LookupResult => {
  const breaches = Array.isArray(data?.breaches) ? data.breaches : [];

  const exposedData: string[] = Array.from(
    new Set(
      breaches.flatMap((b) => (Array.isArray(b?.data_classes) ? b.data_classes : [])),
    ),
  );

  const recentBreaches: BreachRow[] = breaches.slice(0, 3).map((b) => ({
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

const JSON_HEADERS = { "Content-Type": "application/json" };

const fetchLookup = async (email: string): Promise<LookupResult> => {
  const response = await fetch(apiUrl("/api/breach/check"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Breach lookup failed (${response.status})${text ? `: ${text}` : ""}`);
  }

  let payload: BreachApiResponse;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Invalid response from breach service");
  }

  return toLookupResult(payload);
};

export const MonitoredAccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<MonitoredAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccounts = useCallback(async () => {
    try {
      const response = await fetch(apiUrl("/api/user/monitored-accounts"), {
        method: "GET",
        headers: JSON_HEADERS,
      });

      if (!response.ok) {
        setAccounts([]);
        return;
      }

      const payload = (await response.json()) as MonitoredAccountApiResponse[];
      setAccounts(Array.isArray(payload) ? payload.map(toMonitoredAccount) : []);
    } catch {
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void refreshAccounts();
  }, [refreshAccounts]);

  const lookupAccount = useCallback(async (email: string): Promise<LookupResult> => {
    return fetchLookup(email.trim().toLowerCase());
  }, []);

  const addMonitoredAccount = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return { ok: false, error: "Please provide an email to monitor." };
    }

    if (accounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, error: "That account is already being monitored." };
    }

    try {
      const response = await fetch(apiUrl("/api/user/monitored-accounts"), {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!response.ok) {
        let errorMsg = "Unable to monitor account.";
        try {
          const payload = await response.json();
          errorMsg = payload?.detail ?? errorMsg;
        } catch { /* ignore */ }
        return { ok: false, error: errorMsg };
      }

      const payload = (await response.json()) as MonitoredAccountApiResponse;
      const monitoredAccount = toMonitoredAccount(payload);
      setAccounts((prev) => [monitoredAccount, ...prev.filter((a) => a.email !== monitoredAccount.email)]);
      return { ok: true, account: monitoredAccount };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Unable to monitor account." };
    }
  }, [accounts]);

  const removeMonitoredAccount = useCallback((email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    setAccounts((prev) => prev.filter((a) => a.email.toLowerCase() !== normalizedEmail));

    void fetch(apiUrl(`/api/user/monitored-accounts/${encodeURIComponent(normalizedEmail)}`), {
      method: "DELETE",
      headers: JSON_HEADERS,
    });
  }, []);

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
