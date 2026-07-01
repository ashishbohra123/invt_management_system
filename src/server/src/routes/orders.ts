import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { orderController } from "../controllers/orderController.js";

export const orderRouter = Router();
orderRouter.use(authenticate);

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenant_id
 *         schema:
 *           type: string
 *         description: Filter by tenant ID
 *     responses:
 *       200:
 *         description: An array of orders
 */
orderRouter.get("/", orderController.list);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get an order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The order object
 *       404:
 *         description: Order not found
 */
orderRouter.get("/:id", async (req, res) => {
  const { pool } = await import("../config/index.js");
  const result = await pool.query(
    `SELECT o.id, o.tenant_id, o.product_id, o.quantity, o.status, o.created_by, o.approved_by, o.cancelled_by, o.created_at, o.updated_at, p.name AS product_name, p.sku AS product_sku
     FROM orders o LEFT JOIN products p ON p.id = o.product_id WHERE o.id = $1`, [req.params.id]);
  if (result.rowCount === 0) { res.status(404).json({ success: false, error: "Order not found" }); return; }
  const row = result.rows[0];
  res.json({ id: row.id, productId: row.product_id, productName: row.product_name ?? "", productSku: row.product_sku ?? "", quantity: row.quantity, status: row.status, tenantId: row.tenant_id, createdBy: row.created_by, approvedBy: row.approved_by ?? undefined, cancelledBy: row.cancelled_by ?? undefined, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() });
});

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, quantity]
 *             properties:
 *               tenant_id:
 *                 type: string
 *               product_id:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: The created order
 */
orderRouter.post("/", orderController.create);

/**
 * @openapi
 * /orders/{id}/approve:
 *   put:
 *     tags: [Orders]
 *     summary: Approve an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The approved order
 *       400:
 *         description: Order cannot be approved
 */
orderRouter.put("/:id/approve", orderController.approve);

/**
 * @openapi
 * /orders/{id}/cancel:
 *   put:
 *     tags: [Orders]
 *     summary: Cancel an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: The cancelled order
 *       400:
 *         description: Order cannot be cancelled
 */
orderRouter.put("/:id/cancel", orderController.cancel);
