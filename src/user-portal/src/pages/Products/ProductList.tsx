import { useState, useEffect, useCallback, useRef } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";

interface Product {
  id: string; sku: string; name: string; category: string;
  reorderThreshold: number; costPerUnit: number; tenantId: string;
  createdAt: string; updatedAt: string;
}

const API_PATH = "/api/products";

export function ProductList() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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
      if (search) params.set("search", search);
      const res = await fetch(`${API_PATH}?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      const inner = data.data ?? data;
      const list = Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : [];
      setItems(list);
      setTotalPages(inner?.totalPages ?? Math.max(1, Math.ceil((inner?.total ?? list.length) / pageSize)));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, [page, search, pageSize]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  return (
    <div>
      <h1>Products</h1>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <input type="text" placeholder="Search products..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: 8, width: 300 }} />
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #e0e0e0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
                <th style={thStyle}>SKU</th><th style={thStyle}>Name</th>
                <th style={thStyle}>Category</th><th style={thStyle}>Cost</th>
                <th style={thStyle}>Threshold</th><th style={thStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center" }}>No products found.</td></tr>}
              {items.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={tdStyle}>{p.sku}</td>
                  <td style={tdStyle}>{p.name}</td>
                  <td style={tdStyle}>{p.category}</td>
                  <td style={tdStyle}>${Number(p.costPerUnit).toFixed(2)}</td>
                  <td style={tdStyle}>{p.reorderThreshold}</td>
                  <td style={tdStyle}>{new Date(p.createdAt).toLocaleDateString()}</td>
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
