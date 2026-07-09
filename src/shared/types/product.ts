export interface Product {
  id: string; sku: string; name: string; category: string;
  reorderThreshold: number; costPerUnit: number;
  tenantId: string; createdAt: string; updatedAt: string;
}
export interface CreateProductInput { sku: string; name: string; category?: string; reorderThreshold?: number; costPerUnit?: number; tenantId?: string; }
export interface UpdateProductInput { sku?: string; name?: string; category?: string; reorderThreshold?: number; costPerUnit?: number; }
export interface ProductListResponse { data: Product[]; total: number; page: number; pageSize: number; totalPages: number; }
