import { productRepository } from "../repositories/productRepository.js";
import { inventoryRepository } from "../repositories/inventoryRepository.js";
import { isValidSku } from "@moc/shared";
import { AppError } from "./AppError.js";

export const productService = {
  async list(tenantId?: string) {
    return productRepository.findAll(tenantId);
  },

  async getById(id: string) {
    return productRepository.findById(id);
  },

  async create(input: {
    tenantId: string;
    sku: string;
    name: string;
    category?: string;
    reorderThreshold?: number;
    costPerUnit?: number;
  }) {
    if (!input.name || !input.name.trim()) {
      throw new AppError("Product name is required", "VALIDATION_ERROR");
    }
    if (!isValidSku(input.sku)) {
      throw new AppError("Invalid SKU format (3-50 chars, alphanumeric and hyphens)", "VALIDATION_ERROR");
    }

    const existing = await productRepository.findBySku(input.tenantId, input.sku);
    if (existing) {
      throw new AppError("A product with this SKU already exists in this tenant", "VALIDATION_ERROR");
    }

    const product = await productRepository.create(input);
    await inventoryRepository.create(product.id, input.tenantId);
    return product;
  },

  async update(id: string, input: Parameters<typeof productRepository.update>[1]) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError("Product not found", "NOT_FOUND");
    }
    return productRepository.update(id, input);
  },

  async delete(id: string) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError("Product not found", "NOT_FOUND");
    }
    await inventoryRepository.deleteByProductId(id);
    return productRepository.delete(id);
  },
};
