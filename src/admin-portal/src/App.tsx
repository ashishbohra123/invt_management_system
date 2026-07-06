import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, ProtectedRoute, LoginPage, RegisterPage, PortalSelectionPage, useAuth } from "@moc/shared";
import { UserList } from "./pages/Users/index.js";
import { TenantList } from "./pages/Tenants/index.js";
import type { ReactNode } from "react";

const navStyle: React.CSSProperties = {
  background: "#1976d2", padding: "12px 24px",
  display: "flex", gap: 24, alignItems: "center",
  flexWrap: "wrap",
};
const linkStyle: React.CSSProperties = {
  color: "#fff", textDecoration: "none", fontSize: 14,
};
const brandStyle: React.CSSProperties = {
  color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18, marginRight: 16,
};

function Layout({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <nav style={navStyle}>
        <Link to="/" style={brandStyle}>Admin Portal</Link>
        {isAuthenticated && (
          <>
            <Link to="/users" style={linkStyle}>Users</Link>
            <Link to="/tenants" style={linkStyle}>Tenants</Link>
            <Link to="/products" style={linkStyle}>Products</Link>
            <Link to="/orders" style={linkStyle}>Orders</Link>
          </>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          {isAuthenticated ? (
            <>
              <span style={{ color: "#fff", fontSize: 14 }}>{user?.name || user?.email}</span>
              <button onClick={logout} style={{
                padding: "6px 12px", borderRadius: 4, border: "1px solid #fff",
                background: "transparent", color: "#fff", cursor: "pointer", fontSize: 13,
              }}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/admin/login" style={{ color: "#fff", textDecoration: "none", fontSize: 14 }}>Sign In</Link>
          )}
        </div>
      </nav>
      <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>{children}</main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<LoginPage portalTitle="Admin Portal" registerPath="/admin/register" portalSelectPath="/admin/portal-select" />} />
          <Route path="/admin/register" element={<RegisterPage portalTitle="Admin Portal" loginPath="/admin/login" portalSelectPath="/admin/portal-select" />} />
          <Route path="/admin/portal-select" element={<ProtectedRoute portalType="admin" />}>
            <Route index element={<PortalSelectionPage />} />
          </Route>
          <Route element={<ProtectedRoute portalType="admin" />}>
            <Route path="/" element={<Layout><h1>Dashboard</h1><p>Welcome to the admin portal.</p></Layout>} />
            <Route path="/users" element={<Layout><UserList /></Layout>} />
            <Route path="/tenants" element={<Layout><TenantList /></Layout>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
