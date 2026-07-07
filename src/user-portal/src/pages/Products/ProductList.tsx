import { useState, useEffect, useCallback, useRef } from "react";
import { Button, SearchBar, Card, CardContent, Modal, Input, productsService } from "@moc/shared";

interface Product {
  id: string; sku: string; name: string; category: string;
  costPerUnit: number; reorderThreshold: number; tenantId: string;
  createdAt: string; updatedAt: string;
}

const categoryOptions = [
  "Electronics", "Furniture", "Food & Beverage", "Accessories", "Clothing", "Sports", "Books", "Other",
];

const productEmojis: Record<string, string> = {
  Electronics: "\u{1F4F1}", Furniture: "\u{1F6CF}", "Food & Beverage": "\u{1F355}", Accessories: "\u{1F4CB}",
};

export function ProductList() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("latest");
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [form, setForm] = useState({ sku: "", name: "", category: "", costPerUnit: "", reorderThreshold: "10" });
  const abortRef = useRef<AbortController | null>(null);

  const categories = ["All", ...new Set(items.map((p) => p.category).filter(Boolean))];

  const filtered = items
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => category === "All" || p.category === category)
    .sort((a, b) => {
      if (sort === "price-low") return a.costPerUnit - b.costPerUnit;
      if (sort === "price-high") return b.costPerUnit - a.costPerUnit;
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const fetchItems = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(null);
    try {
      const res = await productsService.list();
      const list = Array.isArray(res) ? res : res.data ?? [];
      setItems(list);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const handleCreate = async () => {
    if (!form.sku.trim() || !form.name.trim()) { setError("SKU and Name are required"); return; }
    setCreateSaving(true);
    try {
      await productsService.create({
        sku: form.sku.trim(),
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        cost_per_unit: parseFloat(form.costPerUnit) || 0,
        reorder_threshold: parseInt(form.reorderThreshold) || 10,
      } as any);
      setCreateOpen(false);
      setForm({ sku: "", name: "", category: "", costPerUnit: "", reorderThreshold: "10" });
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally { setCreateSaving(false); }
  };

  const selectStyle: React.CSSProperties = {
    padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: 6,
    fontSize: 14, background: "#fff", color: "#374151", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box", cursor: "pointer",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14, color: "#374151",
  };
  const fieldStyle: React.CSSProperties = { marginBottom: 12 };

  if (loading) return <p style={{ color: "#6B7280" }}>Loading...</p>;
  if (error) return <p style={{ color: "#DC2626" }}>{error}</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111", margin: 0 }}>Products</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product
        </Button>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle}>
          <option value="latest">Latest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name: A-Z</option>
        </select>
        <span style={{ fontSize: 14, color: "#6B7280" }}>{filtered.length} products</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 20 }}>
        {filtered.length === 0 && (
          <p style={{ color: "#9CA3AF", gridColumn: "1 / -1", textAlign: "center", padding: 32 }}>No products found.</p>
        )}
        {filtered.map((product) => (
          <Card key={product.id}>
            <CardContent style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 40, textAlign: "center" }}>
                {productEmojis[product.category] || "\u{1F4E6}"}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#111" }}>{product.name}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>SKU: {product.sku}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>
                ${Number(product.costPerUnit).toFixed(2)}
              </div>
              <Button size="sm">Add to Cart</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        open={createOpen}
        title="Add Product"
        onClose={() => { setCreateOpen(false); setForm({ sku: "", name: "", category: "", costPerUnit: "", reorderThreshold: "10" }); }}
        footer={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setForm({ sku: "", name: "", category: "", costPerUnit: "", reorderThreshold: "10" }); }}>Cancel</Button>
            <Button disabled={createSaving} onClick={handleCreate}>{createSaving ? "Creating..." : "Create Product"}</Button>
          </div>
        }
      >
        <div style={fieldStyle}>
          <label style={labelStyle}>SKU *</label>
          <Input value={form.sku} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="PROD-001" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Name *</label>
          <Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Product name" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Category</label>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={selectStyle}
            onFocus={(e) => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }}>
            <option value="">Select category...</option>
            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Cost per Unit ($)</label>
          <Input type="number" min={0} step="0.01" value={form.costPerUnit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, costPerUnit: e.target.value }))} placeholder="99.99" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Reorder Threshold</label>
          <Input type="number" min={0} value={form.reorderThreshold} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, reorderThreshold: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
