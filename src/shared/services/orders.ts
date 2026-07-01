import { apiGet, apiPost, apiPut } from "./api-client.js";
import type { Order, CreateOrderInput, OrderListResponse } from "../types/index.js";
import { API_PATHS } from "../constants/api-paths.js";

export const ordersService = {
  list: (params?: string) => apiGet<OrderListResponse>(`${API_PATHS.ORDERS}${params ? `?${params}` : ""}`),
  create: (data: CreateOrderInput) => apiPost<Order>(API_PATHS.ORDERS, data),
  approve: (id: string) => apiPut<Order>(`${API_PATHS.ORDERS}/${id}/approve`, {}),
  cancel: (id: string) => apiPut<Order>(`${API_PATHS.ORDERS}/${id}/cancel`, {}),
};
