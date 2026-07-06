import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "./AuthContext.js";

interface LoginPageProps {
  portalTitle?: string;
  registerPath?: string;
}

const featureItems = [
  "Real-time inventory tracking",
  "Automated order fulfillment",
  "Advanced analytics dashboard",
];

export function LoginPage({ portalTitle = "Portal", registerPath = "/register" }: LoginPageProps) {
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
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <div style={{
        width: "50%", minWidth: 500, background: "#1e293b", color: "#fff",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 64px", boxSizing: "border-box",
      }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: "-0.5px" }}>
          IMS Portal
        </h1>
        <p style={{
          fontSize: 15, color: "#94a3b8", lineHeight: "26px",
          margin: 0, marginBottom: 40, maxWidth: 420,
        }}>
          Enterprise inventory management system. Real-time tracking, automated workflows, and powerful analytics — all in one place.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {featureItems.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa", flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: "#94a3b8" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        flex: 1, background: "#fff", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 380, marginTop: -40 }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: "#2563eb", margin: "0 0 35px 0" }}>
            IMS Portal
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 6px 0" }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px 0" }}>
            Sign in to your account
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, color: "#374151", marginBottom: 6, fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email" value={email} required autoFocus
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={{
                  width: "100%", height: 42, padding: "0 14px", fontSize: 14,
                  border: "1px solid #d1d5db", borderRadius: 8, outline: "none",
                  boxSizing: "border-box", color: "#111", background: "#fff",
                  transition: "border-color 0.15s",
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, color: "#374151", marginBottom: 6, fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password" value={password} required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", height: 42, padding: "0 14px", fontSize: 14,
                  border: "1px solid #d1d5db", borderRadius: 8, outline: "none",
                  boxSizing: "border-box", color: "#111", background: "#fff",
                  transition: "border-color 0.15s",
                }}
              />
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 24, marginTop: 4,
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: "#2563eb", margin: 0 }} />
                <span style={{ fontSize: 14, color: "#6b7280", userSelect: "none" }}>Remember me</span>
              </label>
              <span style={{ fontSize: 14, color: "#2563eb", cursor: "pointer" }}>
                Forgot password?
              </span>
            </div>
            {error && (
              <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12, margin: "0 0 12px 0" }} role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={submitting} style={{
              width: "100%", height: 44, fontSize: 15, fontWeight: 600,
              background: submitting ? "#93c5fd" : "#2563eb", color: "#fff",
              border: "none", borderRadius: 8, cursor: submitting ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>

          <button type="button" style={{
            width: "100%", height: 44, fontSize: 14, fontWeight: 500,
            background: "#fff", color: "#111", border: "1px solid #d1d5db",
            borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 10,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
              <path d="M17.64 9.2c0-.637-.057-1.251-.163-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A9 9 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.462.891 11.426 0 9 0A9 9 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <p style={{ fontSize: 13, textAlign: "center", color: "#6b7280", marginTop: 24, marginBottom: 0 }}>
            Don&apos;t have an account?{" "}
            <Link to={registerPath} style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
