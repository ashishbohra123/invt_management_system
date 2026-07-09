import { apiGet, apiPost, apiPut } from "./api-client.js";
import type { InventoryItem, CreateInventoryInput, UpdateInventoryInput, InventoryListResponse } from "../types/index.js";
import { API_PATHS } from "../constants/api-paths.js";

export const inventoryService = {
  list: (params?: string) => apiGet<InventoryListResponse>(`${API_PATHS.INVENTORY}${params ? `?${params}` : ""}`),
  create: (data: CreateInventoryInput) => apiPost<InventoryItem>(API_PATHS.INVENTORY, data),
  update: (id: string, data: UpdateInventoryInput) => apiPut<InventoryItem>(`${API_PATHS.INVENTORY}/${id}`, data),
};
