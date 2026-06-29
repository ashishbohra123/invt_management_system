import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { UserList } from "./pages/Users/index.js";
import { TenantList } from "./pages/Tenants/index.js";

const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
  color: isActive ? "#ffeb3b" : "#fff",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: isActive ? 600 : 400,
});

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
        <Link to="/products" style={{ color: "#fff", textDecoration: "none" }}>Products</Link>
        <Link to="/orders" style={{ color: "#fff", textDecoration: "none" }}>Orders</Link>
      </nav>
      <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>{children}</main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><h1>Dashboard</h1><p>Welcome to the admin portal.</p></Layout>} />
        <Route path="/users" element={<Layout><UserList /></Layout>} />
        <Route path="/tenants" element={<Layout><TenantList /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
