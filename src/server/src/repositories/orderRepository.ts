import { pool } from "../config/index.js";

export interface OrderRow {
  id: string;
  tenant_id: string;
  product_id: string;
  quantity: number;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateOrderInput = {
  tenantId: string;
  productId: string;
  quantity: number;
};

function mapRow(row: OrderRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    productId: row.product_id,
    quantity: row.quantity,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    cancelledBy: row.cancelled_by,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const orderRepository = {
  async findAll(tenantId?: string): Promise<ReturnType<typeof mapRow>[]> {
    let query = `SELECT o.*, p.name as product_name, p.sku as product_sku
                 FROM orders o
                 JOIN products p ON p.id = o.product_id`;
    const params: string[] = [];
    if (tenantId) {
      query += ` WHERE o.tenant_id = $1`;
      params.push(tenantId);
    }
    query += ` ORDER BY o.created_at DESC`;
    const result = await pool.query(query, params);
    return result.rows.map((row: Record<string, unknown>) => ({
      ...mapRow(row as unknown as OrderRow),
      productName: row.product_name as string,
      productSku: row.product_sku as string,
    }));
  },

  async findById(id: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async create(input: CreateOrderInput): Promise<ReturnType<typeof mapRow>> {
    const result = await pool.query(
      `INSERT INTO orders (tenant_id, product_id, quantity, status)
       VALUES ($1, $2, $3, 'created')
       RETURNING *`,
      [input.tenantId, input.productId, input.quantity],
    );
    return mapRow(result.rows[0]);
  },

  async approve(id: string, userId: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(
      `UPDATE orders SET status = 'confirmed', approved_by = $1, approved_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND status = 'created'
       RETURNING *`,
      [userId, id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async cancel(id: string, userId: string, reason?: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(
      `UPDATE orders SET status = 'cancelled', cancelled_by = $1, cancelled_at = NOW(), cancel_reason = $2, updated_at = NOW()
       WHERE id = $3 AND status = 'created'
       RETURNING *`,
      [userId, reason ?? null, id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async updateStatus(id: string, status: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },
};
