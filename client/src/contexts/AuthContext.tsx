/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from "react";

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
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

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
}

const loginWithApi = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Invalid email or password");
  }

  return payload as LoginResponse;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(readCurrentProfile);
  const [accessToken, setAccessToken] = useState<string | null>(readAccessToken);
  const [loading] = useState(false);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email || !password) return { error: "Email and password are required" };
    if (password.length < 6) return { error: "Password must be at least 6 characters" };

    try {
      const payload = await loginWithApi(email, password);
      const profile: UserProfile = {
        id: payload.user_id,
        email: payload.email,
        fullName: payload.email.split("@")[0],
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
    if (password.length < 6) return { error: "Password must be at least 6 characters" };

    try {
      const registerResponse = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const registerPayload = await registerResponse.json();
      if (!registerResponse.ok) {
        return { error: registerPayload?.detail ?? "Unable to create account" };
      }

      const payload = await loginWithApi(email, password);
      const profile: UserProfile = {
        id: payload.user_id,
        email: payload.email,
        fullName: fullName.trim() || payload.email.split("@")[0],
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
