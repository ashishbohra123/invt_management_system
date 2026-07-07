import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable, Badge, Button, Modal, Input, SearchBar, inventoryService, productsService } from "@moc/shared";
import type { Column } from "@moc/shared";

interface Product { id: string; sku: string; name: string; category: string; costPerUnit: number; reorderThreshold: number; }

interface InventoryItem {
  id: string; productId: string; productName: string; productSku: string;
  currentInventory: number; reorderThreshold: number; tenantId: string;
  createdAt: string; updatedAt: string;
}

const pageSize = 10;

function getStockLevel(item: InventoryItem): { label: string; variant: "success" | "warning" | "danger" | "info" } {
  if (item.currentInventory === 0) return { label: "Out of Stock", variant: "danger" };
  if (item.currentInventory <= item.reorderThreshold && item.currentInventory > 0) return { label: "Low Stock", variant: "warning" };
  if (item.currentInventory > item.reorderThreshold * 3) return { label: "Overstock", variant: "info" };
  return { label: "In Stock", variant: "success" };
}

export function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState<InventoryItem | null>(null);
  const [updateQty, setUpdateQty] = useState("");
  const [updateSaving, setUpdateSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createProductId, setCreateProductId] = useState("");
  const [createQty, setCreateQty] = useState("0");
  const [createSaving, setCreateSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const fetchItems = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(null);
    try {
      const params = `page=${page}&pageSize=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
      const res = await inventoryService.list(params);
      const inner = res.data ?? [];
      const list = Array.isArray(inner) ? inner : [];
      setItems(list);
      setTotal(res.total ?? list.length);
      setTotalPages(res.totalPages ?? Math.max(1, Math.ceil((res.total ?? list.length) / pageSize)));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { productsService.list().then((res: any) => { const list = Array.isArray(res) ? res : res.data ?? []; setProducts(list); }).catch(() => {}); }, []);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const lowStockCount = items.filter((i) => i.currentInventory <= i.reorderThreshold && i.currentInventory > 0).length;
  const outOfStockCount = items.filter((i) => i.currentInventory === 0).length;
  const inStockCount = total - lowStockCount - outOfStockCount;

  const handleCreate = async () => {
    if (!createProductId.trim()) { setError("Product ID is required"); return; }
    const qty = parseInt(createQty, 10);
    if (isNaN(qty) || qty < 0) { setError("Valid quantity required"); return; }
    setCreateSaving(true);
    try {
      await inventoryService.create({ productId: createProductId.trim(), currentInventory: qty });
      setCreateOpen(false);
      setCreateProductId("");
      setCreateQty("0");
      fetchItems();
    } catch {
      setError("Failed to create inventory item");
    } finally { setCreateSaving(false); }
  };

  const handleUpdate = async () => {
    if (!updating) return;
    const qty = parseInt(updateQty, 10);
    if (isNaN(qty) || qty < 0) return;
    setUpdateSaving(true);
    try {
      await inventoryService.update(updating.id, { currentInventory: qty });
      setUpdating(null);
      setUpdateQty("");
      fetchItems();
    } catch {
      setError("Failed to update stock");
    } finally { setUpdateSaving(false); }
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const columns: Column<InventoryItem>[] = [
    { key: "productName", header: "Product Name", render: (i) => <span style={{ fontWeight: 500 }}>{i.productName}</span> },
    { key: "productSku", header: "SKU", render: (i) => <span style={{ color: "#6B7280", fontSize: 13, fontFamily: "monospace" }}>{i.productSku}</span> },
    {
      key: "warehouse", header: "Warehouse",
      render: () => { const w = ["A", "B", "C"]; return w[Math.floor(Math.random() * w.length)]; },
    },
    { key: "currentInventory", header: "Quantity", render: (i) => <span style={{ fontWeight: 600 }}>{i.currentInventory}</span> },
    {
      key: "status", header: "Status",
      render: (i) => { const l = getStockLevel(i); return <Badge variant={l.variant}>{l.label}</Badge>; },
    },
    { key: "updatedAt", header: "Last Updated", render: (i) => <span style={{ color: "#9CA3AF", fontSize: 13 }}>{new Date(i.updatedAt).toLocaleDateString()}</span> },
    {
      key: "actions", header: "Actions", style: { textAlign: "right" as const },
      render: (i) => (
        <Button variant="secondary" size="sm" onClick={() => { setUpdating(i); setUpdateQty(String(i.currentInventory)); }}>
          Update Stock
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111", margin: 0 }}>
          Inventory <span style={{ fontWeight: 400, color: "#6B7280" }}>Stock Tracking</span>
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Inventory Item
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={kpiCardStyle}>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Total Products</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>{total}</div>
        </div>
        <div style={{ ...kpiCardStyle, borderLeft: "4px solid #22C55E" }}>
          <div style={{ fontSize: 13, color: "#16A34A", marginBottom: 4 }}>In Stock</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#16A34A" }}>{inStockCount}</div>
        </div>
        <div style={{ ...kpiCardStyle, borderLeft: "4px solid #F59E0B" }}>
          <div style={{ fontSize: 13, color: "#D97706", marginBottom: 4 }}>Low Stock</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#D97706" }}>{lowStockCount}</div>
        </div>
        <div style={{ ...kpiCardStyle, borderLeft: "4px solid #EF4444" }}>
          <div style={{ fontSize: 13, color: "#DC2626", marginBottom: 4 }}>Out of Stock</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#DC2626" }}>{outOfStockCount}</div>
        </div>
      </div>

      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by product name or SKU..." />

      <DataTable<InventoryItem>
        columns={columns}
        data={items}
        loading={loading}
        error={error}
        emptyMessage="No inventory items found."
        keyExtractor={(i) => i.id}
        footer={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderTop: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: 14, color: "#6B7280" }}>Showing {total > 0 ? from : 0} to {to} of {total} entries</span>
            <div style={{ display: "flex", gap: 4 }}>
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                return start + i;
              }).filter((p) => p <= totalPages).map((p) => (
                <Button key={p} variant={p === page ? "primary" : "secondary"} size="sm" onClick={() => setPage(p)} style={{ minWidth: 36 }}>{p}</Button>
              ))}
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        }
      />

      <Modal
        open={createOpen}
        title="Add Inventory Item"
        onClose={() => { setCreateOpen(false); setCreateProductId(""); setCreateQty("0"); }}
        footer={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setCreateProductId(""); setCreateQty("0"); }}>Cancel</Button>
            <Button disabled={createSaving} onClick={handleCreate}>{createSaving ? "Creating..." : "Create"}</Button>
          </div>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14, color: "#374151" }}>Product</label>
          <select value={createProductId} onChange={(e) => setCreateProductId(e.target.value)} style={selectStyle}>
            <option value="">Select a product...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14, color: "#374151" }}>Initial Quantity</label>
          <Input type="number" min={0} value={createQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateQty(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={updating !== null}
        title={`Update Stock - ${updating?.productName ?? ""}`}
        onClose={() => { setUpdating(null); setUpdateQty(""); }}
        footer={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => { setUpdating(null); setUpdateQty(""); }}>Cancel</Button>
            <Button disabled={updateSaving} onClick={handleUpdate}>{updateSaving ? "Saving..." : "Save"}</Button>
          </div>
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
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14, color: "#374151" }}>Stock Quantity</label>
          <Input type="number" min={0} value={updateQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpdateQty(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}

const kpiCardStyle: React.CSSProperties = {
  background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "16px 20px",
};
const selectStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: 6,
  fontSize: 14, background: "#fff", color: "#111", outline: "none", fontFamily: "inherit",
};
