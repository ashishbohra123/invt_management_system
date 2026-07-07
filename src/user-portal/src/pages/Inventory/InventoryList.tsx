import { useState, useEffect, useCallback } from "react";
import {
  DataTable, Badge, Button, Modal, Input, SearchBar, inventoryService, apiPost, apiPut, API_PATHS,
} from "@moc/shared";
import type { Column } from "@moc/shared";

interface InventoryItem {
  id: string; productId: string; productName: string; productSku: string;
  currentInventory: number; reorderThreshold: number; tenantId: string;
  createdAt: string; updatedAt: string;
}

const pageSize = 10;

function getStockLevel(item: InventoryItem): { label: string; variant: "danger" | "warning" | "success" | "info" } {
  if (item.currentInventory === 0) return { label: "Out of Stock", variant: "danger" };
  if (item.currentInventory <= Math.ceil(item.reorderThreshold * 0.25)) return { label: "Critical", variant: "danger" };
  if (item.currentInventory <= item.reorderThreshold) return { label: "Low Stock", variant: "warning" };
  if (item.currentInventory >= item.reorderThreshold * 2) return { label: "Overstock", variant: "info" };
  return { label: "In Stock", variant: "success" };
}

function stockBarPercent(item: InventoryItem): number {
  if (item.reorderThreshold <= 0) return 100;
  return Math.min(100, Math.round((item.currentInventory / (item.reorderThreshold * 2)) * 100));
}

function AddInventoryModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ productId: "", currentInventory: "0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.productId) { setError("Product ID is required"); return; }
    setSaving(true); setError(null);
    try {
      await apiPost(API_PATHS.INVENTORY, {
        product_id: form.productId,
        current_inventory: parseInt(form.currentInventory, 10) || 0,
      });
      onCreated();
      onClose();
      setForm({ productId: "", currentInventory: "0" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} title="Add Inventory Item" onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </>
      }
    >
      {error && <p style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#374151" }}>Product ID *</label>
        <Input value={form.productId} onChange={(e) => setForm(p => ({ ...p, productId: e.target.value }))} placeholder="Product ID" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#374151" }}>Initial Stock</label>
        <Input type="number" min={0} value={form.currentInventory} onChange={(e) => setForm(p => ({ ...p, currentInventory: e.target.value }))} />
      </div>
    </Modal>
  );
}

export function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [updating, setUpdating] = useState<InventoryItem | null>(null);
  const [updateQty, setUpdateQty] = useState("");
  const [updateSaving, setUpdateSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      const result = await inventoryService.list(params.toString());
      const list = result?.data ?? [];
      setItems(list);
      setTotal(result?.total ?? list.length);
      setTotalPages(result?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const lowStockCount = items.filter((i) => i.currentInventory <= i.reorderThreshold && i.currentInventory > 0).length;
  const outOfStockCount = items.filter((i) => i.currentInventory === 0).length;

  const handleUpdate = async () => {
    if (!updating) return;
    const qty = parseInt(updateQty, 10);
    if (isNaN(qty) || qty < 0) return;
    setUpdateSaving(true);
    try {
      await apiPut(`${API_PATHS.INVENTORY}/${updating.id}`, { current_inventory: qty });
      setUpdating(null);
      setUpdateQty("");
      fetchItems();
    } catch {
      setError("Failed to update stock. Please try again.");
    } finally { setUpdateSaving(false); }
  };

  const columns: Column<InventoryItem>[] = [
    {
      key: "productName", header: "Product",
      render: (item) => <span style={{ fontWeight: 500, color: "#111" }}>{item.productName}</span>,
    },
    {
      key: "productSku", header: "SKU",
      render: (item) => <span style={{ color: "#6B7280", fontSize: 13, fontFamily: "monospace" }}>{item.productSku}</span>,
    },
    {
      key: "currentInventory", header: "Stock Level",
      render: (item) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 80, height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
            <div style={{
              width: `${stockBarPercent(item)}%`,
              height: "100%",
              borderRadius: 4,
              background: item.currentInventory === 0 ? "#EF4444"
                : item.currentInventory <= item.reorderThreshold ? "#F59E0B"
                : "#22C55E",
              transition: "width 0.3s",
            }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{item.currentInventory}</span>
        </div>
      ),
    },
    {
      key: "reorderThreshold", header: "Threshold",
      render: (item) => <span style={{ color: "#6B7280" }}>{item.reorderThreshold}</span>,
    },
    {
      key: "status", header: "Status",
      render: (item) => {
        const level = getStockLevel(item);
        return <Badge variant={level.variant}>{level.label}</Badge>;
      },
    },
    {
      key: "updatedAt", header: "Updated",
      render: (item) => <span style={{ color: "#9CA3AF", fontSize: 13 }}>{new Date(item.updatedAt).toLocaleDateString()}</span>,
    },
    {
      key: "actions", header: "Actions",
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { setUpdating(item); setUpdateQty(String(item.currentInventory)); }}
        >
          Update Stock
        </Button>
      ),
      style: { textAlign: "right" as const },
    },
  ];

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111", margin: 0 }}>
          Inventory <span style={{ fontWeight: 400, color: "#6B7280" }}>Stock Tracking</span>
        </h1>
        <Button onClick={() => setAddOpen(true)}>+ Add Inventory</Button>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 160, background: "#fff", border: "1px solid #E5E7EB",
          borderRadius: 8, padding: "16px 20px",
        }}>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Total Items</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>{total}</div>
        </div>
        <div style={{
          flex: 1, minWidth: 160, background: "#fff", border: "1px solid #FEF3C7",
          borderRadius: 8, padding: "16px 20px", borderLeft: "4px solid #F59E0B",
        }}>
          <div style={{ fontSize: 13, color: "#D97706", marginBottom: 4 }}>Low Stock</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#D97706" }}>{lowStockCount}</div>
        </div>
        <div style={{
          flex: 1, minWidth: 160, background: "#fff", border: "1px solid #FEE2E2",
          borderRadius: 8, padding: "16px 20px", borderLeft: "4px solid #EF4444",
        }}>
          <div style={{ fontSize: 13, color: "#DC2626", marginBottom: 4 }}>Out of Stock</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#DC2626" }}>{outOfStockCount}</div>
        </div>
      </div>

      <SearchBar
        value={search}
        onChange={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search by product name or SKU..."
      />

      <DataTable<InventoryItem>
        columns={columns}
        data={items}
        loading={loading}
        error={error}
        emptyMessage="No inventory items found."
        keyExtractor={(item) => item.id}
        footer={
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: 16, borderTop: "1px solid #F3F4F6",
          }}>
            <span style={{ fontSize: 14, color: "#6B7280" }}>
              Showing {total > 0 ? from : 0} to {to} of {total} entries
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                return start + i;
              }).filter((p) => p <= totalPages).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setPage(p)}
                  style={{ minWidth: 36 }}
                >
                  {p}
                </Button>
              ))}
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        }
      />

      <Modal
        open={updating !== null}
        title={`Update Stock - ${updating?.productName ?? ""}`}
        onClose={() => { setUpdating(null); setUpdateQty(""); }}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setUpdating(null); setUpdateQty(""); }}>Cancel</Button>
            <Button disabled={updateSaving} onClick={handleUpdate}>
              {updateSaving ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14, color: "#374151" }}>SKU</label>
          <div style={{ fontSize: 14, color: "#6B7280" }}>{updating?.productSku}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14, color: "#374151" }}>Current Threshold</label>
          <div style={{ fontSize: 14, color: "#6B7280" }}>{updating?.reorderThreshold} units</div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14, color: "#374151" }}>
            Stock Quantity {updating && updating.currentInventory <= updating.reorderThreshold && (
              <span style={{ color: "#F59E0B", fontWeight: 400 }}>(below threshold)</span>
            )}
          </label>
          <Input
            type="number"
            min={0}
            value={updateQty}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpdateQty(e.target.value)}
          />
        </div>
      </Modal>

      <AddInventoryModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={fetchItems} />
    </div>
  );
}
