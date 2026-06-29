import { useState, useEffect, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

const USERS_PATH = "/api/users";

interface FormData {
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
}

const initialForm: FormData = { name: "", email: "", role: "viewer", status: "active" };

export function UserForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${USERS_PATH}/${id}`);
        if (!res.ok) throw new Error("User not found");
        const user = await res.json();
        setForm({ name: user.name, email: user.email, role: user.role, status: user.status });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user");
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `${USERS_PATH}/${id}` : USERS_PATH;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Failed to ${isEdit ? "update" : "create"} user`);
      navigate("/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p>Loading user...</p>;
  if (error && !form.name && isEdit) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1>{isEdit ? "Edit User" : "Create User"}</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            style={inputStyle}
          >
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))}
            style={inputStyle}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading} style={{ ...btnStyle, background: "#1976d2", color: "#fff" }}>
            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
          <button type="button" onClick={() => navigate("/users")} style={{ ...btnStyle, background: "#e0e0e0" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", marginBottom: 4, fontWeight: 500 };
const inputStyle: React.CSSProperties = { width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box" };
const btnStyle: React.CSSProperties = { padding: "8px 16px", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 };
