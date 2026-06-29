import type { User, CreateUserInput, UpdateUserInput, UserListResponse } from "../types/user.js";
import { apiGet, apiPost, apiPut, apiDelete } from "./api-client.js";
import { API_PATHS } from "../constants/api-paths.js";

export const usersService = {
  list: (params?: { page?: number; pageSize?: number; search?: string }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return apiGet<UserListResponse>(`${API_PATHS.USERS}${qs ? `?${qs}` : ""}`, signal);
  },

  get: (id: string) => apiGet<User>(`${API_PATHS.USERS}/${id}`),

  create: (data: CreateUserInput) => apiPost<User>(API_PATHS.USERS, data),

  update: (id: string, data: UpdateUserInput) => apiPut<User>(`${API_PATHS.USERS}/${id}`, data),

  delete: (id: string) => apiDelete<void>(`${API_PATHS.USERS}/${id}`),
};
