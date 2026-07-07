import type { Tenant, CreateTenantInput, UpdateTenantInput } from "../types/tenant.js";
import { apiGet, apiPost, apiPut, apiDelete } from "./api-client.js";
import { API_PATHS } from "../constants/api-paths.js";

export const tenantsService = {
  list: () => apiGet<Tenant[]>(API_PATHS.TENANTS),

  create: (data: CreateTenantInput) => apiPost<Tenant>(API_PATHS.TENANTS, data),

  update: (id: string, data: UpdateTenantInput) => apiPut<Tenant>(`${API_PATHS.TENANTS}/${id}`, data),

  delete: (id: string) => apiDelete<void>(`${API_PATHS.TENANTS}/${id}`),
};
