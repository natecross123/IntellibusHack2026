/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiUrl } from "@/lib/apiBase";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_STORAGE_KEY = "cybershield_current_user";
const ACCESS_TOKEN_STORAGE_KEY = "cybershield_access_token";

const readCurrentProfile = (): UserProfile | null => {
  const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
};

const readAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

interface LoginResponse {
  access_token: string;
  user_id: string;
  email: string;
  full_name?: string;
}

interface MeResponse {
  user_id: string;
  email: string;
  full_name?: string;
}

const parseJsonSafe = async (response: Response): Promise<Record<string, unknown>> => {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { detail: raw };
  }
};

const toLoginResponse = (payload: Record<string, unknown>): LoginResponse => {
  const accessToken = payload.access_token;
  const userId = payload.user_id;
  const email = payload.email;
  const fullName = payload.full_name;

  if (typeof accessToken !== "string" || typeof userId !== "string" || typeof email !== "string") {
    throw new Error("Invalid login response payload from auth service");
  }

  return {
    access_token: accessToken,
    user_id: userId,
    email,
    full_name: typeof fullName === "string" ? fullName : undefined,
  };
};

const toMeResponse = (payload: Record<string, unknown>): MeResponse => {
  const userId = payload.user_id;
  const email = payload.email;
  const fullName = payload.full_name;

  if (typeof userId !== "string" || typeof email !== "string") {
    throw new Error("Invalid session response payload from auth service");
  }

  return {
    user_id: userId,
    email,
    full_name: typeof fullName === "string" ? fullName : undefined,
  };
};

const loginWithApi = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error((payload?.detail as string) ?? `Login failed (${response.status})`);
  }

  return toLoginResponse(payload);
};

const getCurrentUser = async (token: string): Promise<MeResponse> => {
  const response = await fetch(apiUrl("/api/auth/me"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error((payload?.detail as string) ?? "Session expired");
  }

  return toMeResponse(payload);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(readCurrentProfile);
  const [accessToken, setAccessToken] = useState<string | null>(readAccessToken);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await getCurrentUser(accessToken);
        const profile: UserProfile = {
          id: me.user_id,
          email: me.email,
          fullName: me.full_name?.trim() || me.email.split("@")[0],
        };

        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(profile));
        setUser(profile);
      } catch {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrapAuth();
  }, [accessToken]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email || !password) return { error: "Email and password are required" };
    if (password.length < 8) return { error: "Password must be at least 8 characters" };

    try {
      const payload = await loginWithApi(email, password);
      const profile: UserProfile = {
        id: payload.user_id,
        email: payload.email,
        fullName: payload.full_name?.trim() || payload.email.split("@")[0],
      };

      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, payload.access_token);
      setUser(profile);
      setAccessToken(payload.access_token);
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid email or password" };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!email || !password || !fullName) return { error: "All fields are required" };
    if (password.length < 8) return { error: "Password must be at least 8 characters" };

    try {
      const registerResponse = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, full_name: fullName.trim() }),
      });

      const registerPayload = await parseJsonSafe(registerResponse);
      if (!registerResponse.ok) {
        return { error: (registerPayload?.detail as string) ?? `Unable to create account (${registerResponse.status})` };
      }

      const payload = await loginWithApi(email, password);
      const profile: UserProfile = {
        id: payload.user_id,
        email: payload.email,
        fullName: payload.full_name?.trim() || fullName.trim() || payload.email.split("@")[0],
      };

      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, payload.access_token);
      setUser(profile);
      setAccessToken(payload.access_token);
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unable to create account" };
    }
  }, []);

  const signOut = useCallback(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (token) {
      void fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => undefined);
    }

    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    setUser(null);
    setAccessToken(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!email) return { error: "Email is required" };
    // Mock: always succeed
    return {};
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
