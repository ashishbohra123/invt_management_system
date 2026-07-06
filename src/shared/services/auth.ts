import { apiPost, apiGet } from "./api-client.js";
import type { User } from "../types/user.js";

export type LoginResponse = {
  token: string;
  user: Pick<User, "id" | "name" | "email" | "role"> & { portalAccess: string[]; tenantId: string | null };
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role?: string;
  portalAccess?: string[];
  tenantId?: string;
};

export const authService = {
  login: (email: string, password: string) =>
    apiPost<LoginResponse>("/api/auth/login", { email, password }),

  register: (input: RegisterInput) =>
    apiPost<LoginResponse>("/api/auth/register", input),

  getMe: (token: string) =>
    apiGet<{ user: User }>("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
