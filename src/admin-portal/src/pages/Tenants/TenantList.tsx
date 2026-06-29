import { useState, useEffect, useCallback, useRef } from "react";
import { tenantsService, type Tenant } from "@moc/shared";
import { TenantFormModal } from "./TenantFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";

export function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  return (
    <div>
      <div style={headerRow}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Tenants</h1>
        <button onClick={openCreate} style={primaryBtn}>+ New Tenant</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {deleteError && <p style={{ color: "red" }}>{deleteError}</p>}

      {!loading && !error && (
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr style={headerRowBg}>
                <th style={th}>Name</th>
                <th style={th}>Domains</th>
                <th style={th}>Status</th>
                <th style={th}>Created</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 && (
                <tr><td colSpan={5} style={emptyState}>No tenants found.</td></tr>
              )}
              {tenants.map((tenant) => (
                <tr key={tenant.id} style={rowBorder}>
                  <td style={td}>{tenant.name}</td>
                  <td style={td}>{(tenant.domains ?? []).join(", ") || "—"}</td>
                  <td style={td}>
                    <span style={{ color: tenant.status === "active" ? "#2e7d32" : "#d32f2f" }}>
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

const headerRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginBottom: 20,
};
const primaryBtn: React.CSSProperties = {
  padding: "10px 20px", background: "#1976d2", color: "#fff",
  border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14,
  fontWeight: 500,
};
const tableWrap: React.CSSProperties = {
  overflowX: "auto", borderRadius: 8, border: "1px solid #e0e0e0",
};
const table: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 14,
};
const headerRowBg: React.CSSProperties = {
  background: "#f5f5f5", textAlign: "left",
};
const th: React.CSSProperties = {
  padding: "12px 16px", fontWeight: 600, borderBottom: "2px solid #e0e0e0",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "12px 16px", borderBottom: "1px solid #e0e0e0",
};
const rowBorder: React.CSSProperties = {
  borderBottom: "1px solid #e0e0e0",
};
const emptyState: React.CSSProperties = {
  padding: 32, textAlign: "center", color: "#666",
};
const actionBtn: React.CSSProperties = {
  marginRight: 8, color: "#1976d2", border: "none",
  background: "none", cursor: "pointer", fontSize: 13,
};
const actionDangerBtn: React.CSSProperties = {
  color: "#d32f2f", border: "none", background: "none",
  cursor: "pointer", fontSize: 13,
};
