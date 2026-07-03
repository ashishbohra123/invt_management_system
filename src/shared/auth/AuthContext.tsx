import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/auth.js";
import type { LoginResponse } from "../services/auth.js";
import type { User } from "../types/user.js";

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const TOKEN_KEY = "ims_auth_token";
const USER_KEY = "ims_auth_user";

function loadPersistedAuth(): { token: string | null; user: User | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    return {
      token,
      user: userStr ? (JSON.parse(userStr) as User) : null,
    };
  } catch {
    return { token: null, user: null };
  }
}

function persistAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearPersistedAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const { token, user } = loadPersistedAuth();
    return { user, token, isLoading: !token, isAuthenticated: !!token };
  });

  useEffect(() => {
    if (!state.token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    authService
      .getMe(state.token)
      .then((res) => {
        persistAuth(state.token!, res.user);
        setState({ user: res.user, token: state.token, isLoading: false, isAuthenticated: true });
      })
      .catch(() => {
        clearPersistedAuth();
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res: LoginResponse = await authService.login(email, password);
    const user = res.user as unknown as User;
    persistAuth(res.token, user);
    setState({ user, token: res.token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    clearPersistedAuth();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
