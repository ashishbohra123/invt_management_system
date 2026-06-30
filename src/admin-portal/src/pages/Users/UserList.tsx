import { useState, useEffect, useCallback, useRef } from "react";
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

const USERS_PATH = "/api/users";

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
      const inner = data.data;
      const items = Array.isArray(inner)
        ? inner
        : Array.isArray(inner?.data)
          ? inner.data
          : [];
      setUsers(items);
      setTotalPages(
        inner?.totalPages ??
          Math.max(
            1,
            Math.ceil((inner?.total ?? items.length) / pageSize)
          )
      );
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
      <h1>Users</h1>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: 8, width: 300 }}
        />
        <button onClick={openCreate} style={newBtnStyle}>
          + New User
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {deleteError && <p style={{ color: "red" }}>{deleteError}</p>}

      {!loading && !error && (
        <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #e0e0e0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center" }}>No users found.</td></tr>
            )}
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td style={tdStyle}>{user.name}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.role}</td>
                <td style={tdStyle}>
                  <span style={{ color: user.status === "active" ? "#2e7d32" : "#d32f2f" }}>
                    {user.status}
                  </span>
                </td>
                <td style={tdStyle}>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <button onClick={() => openEdit(user)} style={editBtnStyle}>Edit</button>
                  <button onClick={() => setDeleteTarget(user)} style={deleteBtnStyle}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={btnStyle}>Previous</button>
        <span style={{ padding: "8px 0" }}>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={btnStyle}>Next</button>
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

const thStyle: React.CSSProperties = { padding: 12, fontWeight: 600, borderBottom: "2px solid #e0e0e0" };
const tdStyle: React.CSSProperties = { padding: 12 };
const btnStyle: React.CSSProperties = { padding: "8px 16px", cursor: "pointer" };
const newBtnStyle: React.CSSProperties = {
  padding: "8px 16px", background: "#1976d2", color: "#fff",
  border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
};
const editBtnStyle: React.CSSProperties = {
  marginRight: 8, color: "#1976d2", border: "none",
  background: "none", cursor: "pointer", fontSize: 14,
};
const deleteBtnStyle: React.CSSProperties = {
  color: "#d32f2f", border: "none", background: "none", cursor: "pointer", fontSize: 14,
};
