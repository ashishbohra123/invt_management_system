import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.js";

const containerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "center", alignItems: "center",
  minHeight: "100vh", background: "#f0f2f5",
};

const cardStyle: React.CSSProperties = {
  background: "#fff", padding: 40, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  width: 360, maxWidth: "90vw",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #d9d9d9",
  borderRadius: 4, fontSize: 14, boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", background: "#1976d2", color: "#fff",
  border: "none", borderRadius: 4, fontSize: 14, cursor: "pointer", fontWeight: 600,
};

export function LoginPage({ portalTitle = "Portal" }: { portalTitle?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  React.useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{portalTitle}</h1>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>Sign in to continue</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: "#333" }}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: "#333" }}>Password</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: "#d32f2f", fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={submitting} style={{ ...btnStyle, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
