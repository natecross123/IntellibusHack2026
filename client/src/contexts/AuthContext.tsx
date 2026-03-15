import React, { createContext, useContext, useState, useEffect } from "react";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ANONYMOUS_USER: UserProfile = {
  id: "anonymous",
  email: "anonymous@user.local",
  fullName: "Anonymous User",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<UserProfile>(ANONYMOUS_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auth disabled - immediately set loading to false
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};