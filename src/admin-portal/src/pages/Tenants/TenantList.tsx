import { useState, useEffect, useCallback } from "react";
import { tenantsService, type Tenant } from "@moc/shared";
import { TenantFormModal } from "./TenantFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";

export function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tenantsService.list();
      setTenants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tenantsService.delete(deleteTarget.id);
      setTenants((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
      setDeleteTarget(null);
    }
  };

  function openCreate() {
    setEditingTenant(null);
    setModalOpen(true);
  }

  function openEdit(tenant: Tenant) {
    setEditingTenant(tenant);
    setModalOpen(true);
  }

  const filteredTenants = tenants.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={headerRow}>
        <h1 style={pageTitle}>Tenants</h1>
        <button onClick={openCreate} style={primaryBtn}>+ New Tenant</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />
      </div>

      {loading && <p style={loadingText}>Loading...</p>}
      {error && <p style={errorText}>{error}</p>}
      {deleteError && <p style={errorText}>{deleteError}</p>}

      {!loading && !error && (
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>Domains</th>
                <th style={th}>Status</th>
                <th style={th}>Created</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 && (
                <tr><td colSpan={5} style={emptyState}>No tenants found.</td></tr>
              )}
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} style={rowStyle}>
                  <td style={td}>{tenant.name}</td>
                  <td style={td}>{(tenant.domains ?? []).join(", ") || "—"}</td>
                  <td style={td}>
                    <span style={{
                      ...statusBadge,
                      background: tenant.status === "active" ? "#dcfce7" : "#fef2f2",
                      color: tenant.status === "active" ? "#166534" : "#991b1b",
                    }}>
                      {tenant.status}
                    </span>
                  </td>
                  <td style={td}>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                  <td style={td}>
                    <button onClick={() => openEdit(tenant)} style={actionBtn}>Edit</button>
                    <button onClick={() => setDeleteTarget(tenant)} style={actionDangerBtn}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TenantFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTenant(null); }}
        editTenant={editingTenant}
        onSave={fetchTenants}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Tenant"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmStyle="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

const pageTitle: React.CSSProperties = {
  margin: 0, fontSize: 24, fontWeight: 700, color: "#111",
};
const headerRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginBottom: 20,
};
const primaryBtn: React.CSSProperties = {
  padding: "10px 20px", background: "#2563eb", color: "#fff",
  border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14,
  fontWeight: 600,
};
const searchInput: React.CSSProperties = {
  padding: "10px 14px", width: 320, fontSize: 14,
  border: "1px solid #d1d5db", borderRadius: 8, outline: "none",
  boxSizing: "border-box",
};
const loadingText: React.CSSProperties = {
  color: "#6b7280", fontSize: 14,
};
const errorText: React.CSSProperties = {
  color: "#dc2626", fontSize: 14,
};
const tableWrap: React.CSSProperties = {
  overflowX: "auto", borderRadius: 8, border: "1px solid #e5e7eb",
  background: "#fff",
};
const table: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 14,
};
const th: React.CSSProperties = {
  padding: "12px 16px", fontWeight: 600, color: "#374151",
  borderBottom: "1px solid #e5e7eb", background: "#f9fafb",
  whiteSpace: "nowrap", textAlign: "left", fontSize: 13,
  textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = {
  padding: "12px 16px", borderBottom: "1px solid #e5e7eb",
  color: "#374151",
};
const rowStyle: React.CSSProperties = {
  borderBottom: "1px solid #e5e7eb",
};
const emptyState: React.CSSProperties = {
  padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14,
};
const statusBadge: React.CSSProperties = {
  display: "inline-block", padding: "2px 10px", borderRadius: 9999,
  fontSize: 12, fontWeight: 600,
};
const actionBtn: React.CSSProperties = {
  marginRight: 8, color: "#2563eb", border: "none",
  background: "none", cursor: "pointer", fontSize: 14, fontWeight: 500,
};
const actionDangerBtn: React.CSSProperties = {
  color: "#dc2626", border: "none", background: "none",
  cursor: "pointer", fontSize: 14, fontWeight: 500,
};
