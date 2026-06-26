import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
}

const USERS_PATH = "/api/users";

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      const res = await fetch(`${USERS_PATH}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${USERS_PATH}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

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
        <Link to="/users/new" style={{ padding: "8px 16px", background: "#1976d2", color: "#fff", textDecoration: "none", borderRadius: 4 }}>
          + New User
        </Link>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
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
                  <Link to={`/users/${user.id}/edit`} style={{ marginRight: 8 }}>Edit</Link>
                  <button onClick={() => handleDelete(user.id)} style={{ color: "#d32f2f", border: "none", background: "none", cursor: "pointer" }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={btnStyle}>Previous</button>
        <span style={{ padding: "8px 0" }}>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} style={btnStyle}>Next</button>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: 12, fontWeight: 600, borderBottom: "2px solid #e0e0e0" };
const tdStyle: React.CSSProperties = { padding: 12 };
const btnStyle: React.CSSProperties = { padding: "8px 16px", cursor: "pointer" };
