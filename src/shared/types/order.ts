export interface Order {
  id: string; productId: string; productName: string; productSku: string;
  quantity: number; status: string;
  tenantId: string; createdBy: string; approvedBy?: string; cancelledBy?: string;
  createdAt: string; updatedAt: string;
}
export interface CreateOrderInput { productId: string; quantity: number; }
export interface OrderListResponse { data: Order[]; total: number; page: number; pageSize: number; totalPages: number; }
