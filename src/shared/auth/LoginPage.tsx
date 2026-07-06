import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.js";
import { Input, Button, Card, CardContent, Label } from "../components/ui/index.js";

interface LoginPageProps {
  portalTitle?: string;
}

export function LoginPage({ portalTitle = "Portal" }: LoginPageProps) {
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
    <div
      style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        minHeight: "100vh", background: "#f0f2f5",
      }}
    >
      <Card style={{ width: 360, maxWidth: "90vw", padding: 0 }}>
        <CardContent>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>{portalTitle}</h1>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>Sign in to continue</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p style={{ color: "#d32f2f", fontSize: 13, marginBottom: 12 }} role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} style={{ width: "100%" }}>
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
