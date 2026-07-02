import { useState, useEffect, useRef, type FormEvent } from "react";
import { Role, PortalType, isValidEmail } from "@moc/shared";

const USERS_PATH = "/api/users";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  editUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: "active" | "inactive";
    portalAccess: string[];
  } | null;
  onSave: () => void;
}

interface Toast {
  type: "success" | "error";
  message: string;
}

const ROLE_OPTIONS = [
  { value: Role.SUPER_ADMIN, label: "Super Admin" },
  { value: Role.ADMIN, label: "Admin" },
  { value: Role.MANAGER, label: "Manager" },
  { value: Role.VIEWER, label: "Viewer" },
];

const PORTAL_OPTIONS = [
  { value: PortalType.ADMIN, label: "Admin Portal" },
];

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: Role.VIEWER,
  portalAccess: [PortalType.ADMIN] as string[],
  isActive: true,
};

export function UserFormModal({ open, onClose, editUser, onSave }: UserFormModalProps) {
  const isEdit = Boolean(editUser);
  const mountedRef = useRef(true);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setErrors({});
      setToast(null);
      return;
    }
    if (editUser) {
      setForm({
        name: editUser.name || "",
        email: editUser.email || "",
        password: "",
        role: editUser.role || Role.VIEWER,
        portalAccess: editUser.portalAccess?.length ? editUser.portalAccess : [PortalType.ADMIN],
        isActive: editUser.status === "active",
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
    setToast(null);
  }, [open, editUser]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!isValidEmail(form.email)) next.email = "Invalid email format";
    if (!isEdit && !form.password) next.password = "Password is required";
    else if (!isEdit && form.password.length < 6) next.password = "Password must be at least 6 characters";
    if (!form.portalAccess.length) next.portalAccess = "Select at least one portal";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.isActive ? "active" : "inactive",
        portalAccess: form.portalAccess,
        ...(isEdit ? {} : { password: form.password }),
      };
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `${USERS_PATH}/${editUser!.id}` : USERS_PATH;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to ${isEdit ? "update" : "create"} user`);
      setToast({ type: "success", message: `User ${isEdit ? "updated" : "created"} successfully` });
      setTimeout(() => { if (mountedRef.current) { onSave(); onClose(); } }, 800);
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Operation failed" });
    } finally {
      setSaving(false);
    }
  }

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  function togglePortalAccess(portal: string) {
    setField(
      "portalAccess",
      form.portalAccess.includes(portal)
        ? form.portalAccess.filter((p) => p !== portal)
        : [...form.portalAccess, portal],
    );
  }

  if (!open) return null;

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{isEdit ? "Edit User" : "Create User"}</h2>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={bodyStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                style={inputStyle}
              />
              {errors.name && <span style={errorTextStyle}>{errors.name}</span>}
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                style={inputStyle}
              />
              {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
            </div>

            {!isEdit && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  style={inputStyle}
                />
                {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
              </div>
            )}

            <div style={fieldStyle}>
              <label style={labelStyle}>Role</label>
              <select
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
                style={inputStyle}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Portal Access</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PORTAL_OPTIONS.map((opt) => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.portalAccess.includes(opt.value)}
                      onChange={() => togglePortalAccess(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {errors.portalAccess && <span style={errorTextStyle}>{errors.portalAccess}</span>}
            </div>

            <div style={fieldStyle}>
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                />
                Active
              </label>
            </div>
          </div>

          <div style={footerStyle}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={saving} style={submitBtnStyle}>
              {saving ? "Saving..." : isEdit ? "Update User" : "Create User"}
            </button>
          </div>
        </form>

        {toast && (
          <div style={toastStyle(toast.type)}>
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999,
};

const modalStyle: React.CSSProperties = {
  position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
  background: "#fff", borderRadius: 8, width: 480, maxWidth: "90vw",
  maxHeight: "85vh", overflowY: "auto", zIndex: 1000,
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};

const headerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "16px 20px", borderBottom: "1px solid #e0e0e0",
};

const closeBtnStyle: React.CSSProperties = {
  background: "none", border: "none", fontSize: 24, cursor: "pointer",
  color: "#666", lineHeight: 1, padding: "0 4px",
};

const bodyStyle: React.CSSProperties = { padding: "16px 20px" };

const fieldStyle: React.CSSProperties = { marginBottom: 16 };

const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: 4, fontWeight: 500, fontSize: 14,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #ccc",
  borderRadius: 4, boxSizing: "border-box", fontSize: 14, outline: "none",
};

const errorTextStyle: React.CSSProperties = {
  color: "#d32f2f", fontSize: 12, marginTop: 2, display: "block",
};

const footerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "flex-end", gap: 8,
  padding: "12px 20px", borderTop: "1px solid #e0e0e0",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 16px", border: "1px solid #ccc", borderRadius: 4,
  background: "#fff", cursor: "pointer", fontSize: 14,
};

const submitBtnStyle: React.CSSProperties = {
  padding: "8px 16px", border: "none", borderRadius: 4,
  background: "#1976d2", color: "#fff", cursor: "pointer", fontSize: 14,
};

const toastStyle = (type: "success" | "error"): React.CSSProperties => ({
  position: "absolute", bottom: -56, left: 20, right: 20,
  padding: "10px 16px", borderRadius: 4, fontSize: 14, textAlign: "center",
  color: "#fff", background: type === "success" ? "#2e7d32" : "#d32f2f",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
});
