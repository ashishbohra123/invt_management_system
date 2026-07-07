import { pool } from "../config/index.js";

export interface InventoryRow {
  id: string;
  product_id: string;
  tenant_id: string;
  current_inventory: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: InventoryRow) {
  return {
    id: row.id,
    productId: row.product_id,
    tenantId: row.tenant_id,
    currentInventory: row.current_inventory,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const inventoryRepository = {
  async findAll(tenantId?: string, search?: string, page?: number, pageSize?: number): Promise<{ data: ReturnType<typeof mapRow>[]; total: number }> {
    let query = `SELECT inv.*, p.name as product_name, p.sku as product_sku, p.reorder_threshold as reorder_threshold
                 FROM inventory inv
                 JOIN products p ON p.id = inv.product_id`;
    const params: string[] = [];
    const conditions: string[] = [];
    if (tenantId) {
      conditions.push(`inv.tenant_id = $${params.length + 1}`);
      params.push(tenantId);
    }
    if (search) {
      conditions.push(`(p.name ILIKE $${params.length + 1} OR p.sku ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }
    if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
    query += ` ORDER BY p.name ASC`;

    const countResult = await pool.query(`SELECT COUNT(*) as total FROM (${query}) sub`, params);
    const total = parseInt(countResult.rows[0]?.total ?? "0", 10);

    const p = page ?? 1;
    const ps = pageSize ?? 10;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(String(ps), String((p - 1) * ps));

    const result = await pool.query(query, params);
    return {
      data: result.rows.map((row: Record<string, unknown>) => ({
        ...mapRow(row as unknown as InventoryRow),
        productName: row.product_name as string,
        productSku: row.product_sku as string,
        reorderThreshold: row.reorder_threshold as number,
      })),
      total,
    };
  },

  async findById(id: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(`SELECT * FROM inventory WHERE id = $1`, [id]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async findByIdWithProduct(id: string): Promise<ReturnType<typeof mapRow> & { productName: string; productSku: string; reorderThreshold: number } | null> {
    const result = await pool.query(
      `SELECT inv.*, p.name as product_name, p.sku as product_sku, p.reorder_threshold as reorder_threshold
       FROM inventory inv
       JOIN products p ON p.id = inv.product_id
       WHERE inv.id = $1`,
      [id],
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...mapRow(row),
      productName: row.product_name,
      productSku: row.product_sku,
      reorderThreshold: row.reorder_threshold,
    };
  },

  async findByProductId(productId: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(`SELECT * FROM inventory WHERE product_id = $1`, [productId]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async create(productId: string, tenantId: string): Promise<ReturnType<typeof mapRow>> {
    const result = await pool.query(
      `INSERT INTO inventory (product_id, tenant_id, current_inventory)
       VALUES ($1, $2, 0)
       RETURNING *`,
      [productId, tenantId],
    );
    return mapRow(result.rows[0]);
  },

  async updateStock(id: string, quantity: number): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(
      `UPDATE inventory SET current_inventory = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [quantity, id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async adjustStock(productId: string, delta: number): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(
      `UPDATE inventory SET current_inventory = current_inventory + $1, updated_at = NOW()
       WHERE product_id = $2 RETURNING *`,
      [delta, productId],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async deleteByProductId(productId: string): Promise<boolean> {
    const result = await pool.query(`DELETE FROM inventory WHERE product_id = $1`, [productId]);
    return (result.rowCount ?? 0) > 0;
  },
};
