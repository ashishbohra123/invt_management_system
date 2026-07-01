import { apiGet, apiPut } from "./api-client.js";
import type { InventoryItem, UpdateInventoryInput, InventoryListResponse } from "../types/index.js";
import { API_PATHS } from "../constants/api-paths.js";

export const inventoryService = {
  list: (params?: string) => apiGet<InventoryListResponse>(`${API_PATHS.INVENTORY}${params ? `?${params}` : ""}`),
  update: (id: string, data: UpdateInventoryInput) => apiPut<InventoryItem>(`${API_PATHS.INVENTORY}/${id}`, data),
};
