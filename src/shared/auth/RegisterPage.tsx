import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/auth.js";

interface RegisterPageProps {
  portalTitle?: string;
  loginPath?: string;
  portalSelectPath?: string;
}

export function RegisterPage({ portalTitle = "Portal", loginPath = "/login", portalSelectPath = "/portal-select" }: RegisterPageProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      await authService.register({ name, email, password });
      navigate(loginPath, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{
        flex: "0 0 976px", background: "#1e293b", color: "#fff",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 80px", boxSizing: "border-box",
      }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, margin: "0 0 8px 0" }}>{portalTitle}</h1>
        <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.6, margin: "0 0 40px 0", maxWidth: 420 }}>
          Enterprise inventory management system. Real-time tracking, automated workflows, and powerful analytics — all in one place.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {["Real-time inventory tracking", "Automated order fulfillment", "Advanced analytics dashboard"].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: "#60a5fa", flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: "#94a3b8" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        flex: 1, background: "#fff", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 380 }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: "#2563eb", margin: "0 0 32px 0" }}>
            {portalTitle}
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 4px 0" }}>
            Create account
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px 0" }}>
            Sign up to get started
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 15, color: "#374151", marginBottom: 6, fontWeight: 500 }}>
                Name
              </label>
              <input
                type="text" value={name} required autoFocus
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: "100%", padding: "10px 14px", fontSize: 14,
                  border: "1px solid #d1d5db", borderRadius: 8, outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 15, color: "#374151", marginBottom: 6, fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email" value={email} required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={{
                  width: "100%", padding: "10px 14px", fontSize: 14,
                  border: "1px solid #d1d5db", borderRadius: 8, outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 15, color: "#374151", marginBottom: 6, fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password" value={password} required minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "10px 14px", fontSize: 14,
                  border: "1px solid #d1d5db", borderRadius: 8, outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 15, color: "#374151", marginBottom: 6, fontWeight: 500 }}>
                Confirm Password
              </label>
              <input
                type="password" value={confirmPassword} required
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "10px 14px", fontSize: 14,
                  border: "1px solid #d1d5db", borderRadius: 8, outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
              />
            </div>
            {error && (
              <p style={{ color: "#d32f2f", fontSize: 13, marginBottom: 12 }} role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={submitting} style={{
              width: "100%", padding: 12, fontSize: 15, fontWeight: 700,
              background: submitting ? "#93c5fd" : "#2563eb", color: "#fff",
              border: "none", borderRadius: 8, cursor: submitting ? "not-allowed" : "pointer",
            }}>
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p style={{ fontSize: 13, textAlign: "center", color: "#6b7280", marginTop: 24 }}>
            Already have an account?{" "}
            <Link to={loginPath} style={{ color: "#2563eb", textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
