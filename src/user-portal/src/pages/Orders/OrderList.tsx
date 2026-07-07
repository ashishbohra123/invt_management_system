import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Card, CardContent, Badge, Modal, Input, ordersService, productsService } from "@moc/shared";

interface Product { id: string; sku: string; name: string; }
interface Order {
  id: string; productId: string; productName: string; productSku: string;
  quantity: number; status: string; tenantId: string;
  createdBy: string; approvedBy?: string; cancelledBy?: string;
  createdAt: string; updatedAt: string;
}

const tabs = [
  { label: "All", value: "" },
  { label: "Pending", value: "created" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "approved" },
  { label: "Delivered", value: "delivered" },
];

const statusColors: Record<string, "info" | "success" | "warning" | "danger" | "default"> = {
  processing: "info", approved: "success", created: "warning", cancelled: "danger", delivered: "success",
};

const statusLabels: Record<string, string> = {
  processing: "Processing", approved: "Shipped", created: "Pending", cancelled: "Cancelled", delivered: "Delivered",
};

export function OrderList() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newProductId, setNewProductId] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [createSaving, setCreateSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const fetchItems = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(null);
    try {
      const params = tab ? `status=${tab}` : "";
      const res = await ordersService.list(params);
      const list = Array.isArray(res) ? res : res.data ?? [];
      setItems(list);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { productsService.list().then((res: any) => { const list = Array.isArray(res) ? res : res.data ?? []; setProducts(list); }).catch(() => {}); }, []);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const handleCreate = async () => {
    if (!newProductId.trim()) { setError("Product ID is required"); return; }
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty < 1) { setError("Valid quantity required"); return; }
    setCreateSaving(true);
    try {
      await ordersService.create({ productId: newProductId.trim(), quantity: qty });
      setCreateOpen(false);
      setNewProductId("");
      setNewQty("1");
      fetchItems();
    } catch {
      setError("Failed to create order");
    } finally { setCreateSaving(false); }
  };

  const countByStatus = (status: string) => status === "" ? items.length : items.filter((o) => o.status === status).length;

  if (loading) return <p style={{ color: "#6B7280" }}>Loading...</p>;
  if (error) return <p style={{ color: "#DC2626" }}>{error}</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111", margin: 0 }}>Orders</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Order
        </Button>
      </div>

      <div style={{ display: "inline-flex", gap: 4, marginBottom: 24, background: "#F3F4F6", borderRadius: 8, padding: 4 }}>
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            style={{
              padding: "8px 16px", border: "none", borderRadius: 6,
              background: tab === t.value ? "#fff" : "transparent",
              color: tab === t.value ? "#111" : "#6B7280",
              cursor: "pointer", fontSize: 14, fontWeight: tab === t.value ? 600 : 400,
              boxShadow: tab === t.value ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              fontFamily: "inherit", transition: "all 0.2s",
            }}
          >
            {t.label} ({countByStatus(t.value)})
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.length === 0 && (
          <p style={{ color: "#9CA3AF", textAlign: "center", padding: 32 }}>No orders found.</p>
        )}
        {items.map((order) => (
          <Card key={order.id}>
            <CardContent style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{order.id}</span>
                  <Badge variant={statusColors[order.status] || "default"}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>
                  {order.productName} x{order.quantity}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        open={createOpen}
        title="New Order"
        onClose={() => { setCreateOpen(false); setNewProductId(""); setNewQty("1"); }}
        footer={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setNewProductId(""); setNewQty("1"); }}>Cancel</Button>
            <Button disabled={createSaving} onClick={handleCreate}>{createSaving ? "Creating..." : "Create Order"}</Button>
          </div>
        }
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14, color: "#374151" }}>Product</label>
          <select value={newProductId} onChange={(e) => setNewProductId(e.target.value)} style={selectStyle}>
            <option value="">Select a product...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14, color: "#374151" }}>Quantity</label>
          <Input type="number" min={1} value={newQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewQty(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: 6,
  fontSize: 14, background: "#fff", color: "#111", outline: "none", fontFamily: "inherit",
};
