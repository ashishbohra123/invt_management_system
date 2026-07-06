import { useState, useEffect, useCallback, useRef } from "react";
import { API_PATHS } from "@moc/shared";
import { UserFormModal } from "./UserFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  portalAccess?: string[];
  createdAt: string;
}

const USERS_PATH = API_PATHS.USERS;

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pageSize = 10;
  const abortRef = useRef<AbortController | null>(null);

  const fetchUsers = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      const res = await fetch(`${USERS_PATH}?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.data ?? [];
      setUsers(items);
      setTotalPages(data.totalPages ?? Math.ceil((data.total ?? items.length) / pageSize));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, search, pageSize]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${USERS_PATH}/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
      setDeleteTarget(null);
    }
  };

  function openCreate() {
    setEditingUser(null);
    setModalOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
  }

  return (
    <div>
      <div style={headerRow}>
        <h1 style={pageTitle}>Users</h1>
        <button onClick={openCreate} style={primaryBtn}>
          + New User
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
              <th style={th}>Email</th>
              <th style={th}>Role</th>
              <th style={th}>Status</th>
              <th style={th}>Created</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={6} style={emptyState}>No users found.</td></tr>
            )}
            {users.map((user) => (
              <tr key={user.id} style={rowStyle}>
                <td style={td}>{user.name}</td>
                <td style={td}>{user.email}</td>
                <td style={td}>
                  <span style={roleBadge}>{user.role}</span>
                </td>
                <td style={td}>
                  <span style={{
                    ...statusBadge,
                    background: user.status === "active" ? "#dcfce7" : "#fef2f2",
                    color: user.status === "active" ? "#166534" : "#991b1b",
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={td}>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td style={td}>
                  <button onClick={() => openEdit(user)} style={actionBtn}>Edit</button>
                  <button onClick={() => setDeleteTarget(user)} style={actionDangerBtn}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <div style={paginationRow}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={pageBtn}>Previous</button>
        <span style={pageInfo}>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={pageBtn}>Next</button>
      </div>

      <UserFormModal
        open={modalOpen}
        onClose={closeModal}
        editUser={editingUser ? { ...editingUser, portalAccess: editingUser.portalAccess ?? [] } : null}
        onSave={fetchUsers}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name ?? "this user"}? This action cannot be undone.`}
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
const roleBadge: React.CSSProperties = {
  display: "inline-block", padding: "2px 10px", borderRadius: 6,
  fontSize: 12, fontWeight: 500, background: "#f3f4f6", color: "#374151",
};
const paginationRow: React.CSSProperties = {
  marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 12,
};
const pageBtn: React.CSSProperties = {
  padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 6,
  background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151",
  fontWeight: 500,
};
const pageInfo: React.CSSProperties = {
  padding: "8px 0", fontSize: 14, color: "#6b7280",
};
const actionBtn: React.CSSProperties = {
  marginRight: 8, color: "#2563eb", border: "none",
  background: "none", cursor: "pointer", fontSize: 14, fontWeight: 500,
};
const actionDangerBtn: React.CSSProperties = {
  color: "#dc2626", border: "none", background: "none",
  cursor: "pointer", fontSize: 14, fontWeight: 500,
};
