import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { inventoryController } from "../controllers/inventoryController.js";

export const inventoryRouter = Router();
inventoryRouter.use(authenticate);

/**
 * @openapi
 * /inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: List inventory records
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
 *         description: An array of inventory records
 */
inventoryRouter.get("/", inventoryController.list);

/**
 * @openapi
 * /inventory/{id}:
 *   put:
 *     tags: [Inventory]
 *     summary: Update inventory stock
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_inventory]
 *             properties:
 *               current_inventory:
 *                 type: integer
 *                 description: The new stock quantity
 *     responses:
 *       200:
 *         description: The updated inventory record
 */
inventoryRouter.put("/:id", inventoryController.update);
