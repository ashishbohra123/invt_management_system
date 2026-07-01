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
  async findAll(tenantId?: string): Promise<ReturnType<typeof mapRow>[]> {
    let query = `SELECT inv.*, p.name as product_name, p.sku as product_sku
                 FROM inventory inv
                 JOIN products p ON p.id = inv.product_id`;
    const params: string[] = [];
    if (tenantId) {
      query += ` WHERE inv.tenant_id = $1`;
      params.push(tenantId);
    }
    query += ` ORDER BY p.name ASC`;
    const result = await pool.query(query, params);
    return result.rows.map((row: Record<string, unknown>) => ({
      ...mapRow(row as unknown as InventoryRow),
      productName: row.product_name as string,
      productSku: row.product_sku as string,
    }));
  },

  async findById(id: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(`SELECT * FROM inventory WHERE id = $1`, [id]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
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
