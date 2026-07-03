import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, ProtectedRoute, LoginPage } from "@moc/shared";
import { UserList } from "./pages/Users/index.js";
import { TenantList } from "./pages/Tenants/index.js";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <nav style={{
        background: "#1976d2", padding: "12px 24px",
        display: "flex", gap: 24, alignItems: "center",
        flexWrap: "wrap",
      }}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
          Admin Portal
        </Link>
        <Link to="/users" style={{ color: "#fff", textDecoration: "none" }}>Users</Link>
        <Link to="/tenants" style={{ color: "#fff", textDecoration: "none" }}>Tenants</Link>
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
          <Route path="/admin/login" element={<LoginPage portalTitle="Admin Portal" />} />
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
