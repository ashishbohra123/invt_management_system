import { useState, useEffect, useCallback, useRef } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";

interface InventoryItem {
  id: string; productId: string; productName: string; productSku: string;
  currentInventory: number; reorderThreshold: number; tenantId: string;
  createdAt: string; updatedAt: string;
}

const API_PATH = "/api/inventory";

export function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const abortRef = useRef<AbortController | null>(null);
  const pageSize = 10;

  const fetchItems = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const res = await fetch(`${API_PATH}?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const data = await res.json();
      const inner = data.data ?? data;
      const list = Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : [];
      setItems(list);
      setTotalPages(inner?.totalPages ?? Math.max(1, Math.ceil((inner?.total ?? list.length) / pageSize)));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const isLowStock = (item: InventoryItem) => item.currentInventory <= item.reorderThreshold;

  return (
    <div>
      <h1>Inventory <span style={{ fontSize: 14, fontWeight: 400, color: "#666" }}>Stock Tracking</span></h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #e0e0e0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
                <th style={thStyle}>Product</th><th style={thStyle}>SKU</th>
                <th style={thStyle}>Stock</th><th style={thStyle}>Threshold</th>
                <th style={thStyle}>Status</th><th style={thStyle}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center" }}>No inventory records found.</td></tr>}
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #e0e0e0", background: isLowStock(item) ? "#fff3e0" : "transparent" }}>
                  <td style={tdStyle}>{item.productName}</td>
                  <td style={tdStyle}>{item.productSku}</td>
                  <td style={tdStyle}>{item.currentInventory}</td>
                  <td style={tdStyle}>{item.reorderThreshold}</td>
                  <td style={tdStyle}>
                    <span style={{ color: isLowStock(item) ? "#e65100" : "#2e7d32", fontWeight: 600 }}>
                      {isLowStock(item) ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                  <td style={tdStyle}>{new Date(item.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={btnStyle}>Previous</button>
        <span style={{ padding: "8px 0" }}>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={btnStyle}>Next</button>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: 12, fontWeight: 600, borderBottom: "2px solid #e0e0e0" };
const tdStyle: React.CSSProperties = { padding: 12 };
const btnStyle: React.CSSProperties = { padding: "8px 16px", cursor: "pointer" };
