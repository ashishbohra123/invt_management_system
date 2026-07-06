import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.js";
import { Input, Button, Card, CardContent, Label } from "../components/ui/index.js";

interface RegisterPageProps {
  portalTitle?: string;
  loginPath?: string;
}

export function RegisterPage({ portalTitle = "Portal", loginPath = "/login" }: RegisterPageProps) {
  const navigate = useNavigate();
  const { register } = useAuth();
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
      await register(name, email, password);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: "100vh", background: "#f0f2f5",
    }}>
      <Card style={{ width: 360, maxWidth: "90vw", padding: 0 }}>
        <CardContent>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>{portalTitle}</h1>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>Create a new account</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <Label htmlFor="reg-name">Name</Label>
              <Input id="reg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Label htmlFor="reg-password">Password</Label>
              <Input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Label htmlFor="reg-confirm">Confirm Password</Label>
              <Input id="reg-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            {error && (
              <p style={{ color: "#d32f2f", fontSize: 13, marginBottom: 12 }} role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} style={{ width: "100%" }}>
              {submitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <p style={{ fontSize: 13, textAlign: "center", marginTop: 16 }}>
            Already have an account?{" "}
            <a href={loginPath} style={{ color: "#1976d2" }}>Sign in</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
