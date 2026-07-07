import { inventoryRepository } from "../repositories/inventoryRepository.js";
import { AppError } from "./AppError.js";

export const inventoryService = {
  async list(tenantId?: string, search?: string, page?: number, pageSize?: number) {
    return inventoryRepository.findAll(tenantId, search, page, pageSize);
  },

  async create(productId: string, tenantId: string, currentInventory?: number) {
    const existing = await inventoryRepository.findByProductId(productId);
    if (existing) {
      throw new AppError("Inventory record already exists for this product", "VALIDATION_ERROR");
    }
    return inventoryRepository.create(productId, tenantId, currentInventory);
  },

  async getById(id: string) {
    const record = await inventoryRepository.findByIdWithProduct(id);
    if (!record) {
      throw new AppError("Inventory record not found", "NOT_FOUND");
    }
    return record;
  },

  async updateStock(id: string, quantity: number) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
      throw new AppError("Inventory record not found", "NOT_FOUND");
    }
    if (quantity < 0) {
      throw new AppError("Inventory quantity cannot be negative", "VALIDATION_ERROR");
    }
    return inventoryRepository.updateStock(id, quantity);
  },
};
