import { apiGet, apiPost, apiPut, apiDelete } from "./api-client.js";
import type { Product, CreateProductInput, UpdateProductInput, ProductListResponse } from "../types/index.js";
import { API_PATHS } from "../constants/api-paths.js";

export const productsService = {
  list: (params?: string) => apiGet<ProductListResponse>(`${API_PATHS.PRODUCTS}${params ? `?${params}` : ""}`),
  get: (id: string) => apiGet<Product>(`${API_PATHS.PRODUCTS}/${id}`),
  create: (data: CreateProductInput) => apiPost<Product>(API_PATHS.PRODUCTS, data),
  update: (id: string, data: UpdateProductInput) => apiPut<Product>(`${API_PATHS.PRODUCTS}/${id}`, data),
  delete: (id: string) => apiDelete<void>(`${API_PATHS.PRODUCTS}/${id}`),
};
