import { apiGet, apiPost } from "./api-client.js";
import type { Product, CreateProductInput, ProductListResponse } from "../types/index.js";
import { API_PATHS } from "../constants/api-paths.js";

export const productsService = {
  list: (params?: string) => apiGet<ProductListResponse>(`${API_PATHS.PRODUCTS}${params ? `?${params}` : ""}`),
  create: (data: CreateProductInput) => apiPost<Product>(API_PATHS.PRODUCTS, data),
};
