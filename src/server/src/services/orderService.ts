import { orderRepository } from "../repositories/orderRepository.js";
import { productRepository } from "../repositories/productRepository.js";
import { inventoryRepository } from "../repositories/inventoryRepository.js";
import { AppError } from "./AppError.js";

export const orderService = {
  async list(tenantId?: string) {
    return orderRepository.findAll(tenantId);
  },

  async getById(id: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", "NOT_FOUND");
    }
    return order;
  },

  async create(input: { tenantId: string; productId: string; quantity: number }) {
    if (!input.quantity || input.quantity <= 0) {
      throw new AppError("Quantity must be a positive integer", "VALIDATION_ERROR");
    }

    const product = await productRepository.findById(input.productId);
    if (!product) {
      throw new AppError("Product not found", "NOT_FOUND");
    }

    const inventory = await inventoryRepository.findByProductId(input.productId);
    if (!inventory) {
      throw new AppError("No inventory record for this product", "NOT_FOUND");
    }

    if (inventory.currentInventory < input.quantity) {
      throw new AppError("Insufficient inventory", "VALIDATION_ERROR");
    }

    return orderRepository.create(input);
  },

  async approve(id: string, userId: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", "NOT_FOUND");
    }
    if (order.status !== "created") {
      throw new AppError(`Order cannot be approved in status '${order.status}'`, "VALIDATION_ERROR");
    }

    const inventory = await inventoryRepository.findByProductId(order.productId);
    if (!inventory) {
      throw new AppError("No inventory record for this product", "NOT_FOUND");
    }
    if (inventory.currentInventory < order.quantity) {
      throw new AppError("Insufficient inventory to approve order", "VALIDATION_ERROR");
    }

    await inventoryRepository.adjustStock(order.productId, -order.quantity);
    return orderRepository.approve(id, userId);
  },

  async cancel(id: string, userId: string, reason?: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", "NOT_FOUND");
    }
    if (order.status !== "created") {
      throw new AppError(`Order cannot be cancelled in status '${order.status}'`, "VALIDATION_ERROR");
    }

    return orderRepository.cancel(id, userId, reason);
  },
};
