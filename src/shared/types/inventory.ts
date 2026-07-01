export interface InventoryItem {
  id: string; productId: string; productName: string; productSku: string;
  currentInventory: number; reorderThreshold: number;
  tenantId: string; createdAt: string; updatedAt: string;
}
export interface UpdateInventoryInput { currentInventory: number; }
export interface InventoryListResponse { data: InventoryItem[]; total: number; page: number; pageSize: number; totalPages: number; }
