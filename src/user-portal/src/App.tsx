import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, ProtectedRoute, LoginPage, RegisterPage, useAuth } from "@moc/shared";
import { ToastProvider } from "./components/ui/Toast";
import { ProductList } from "./pages/Products/index";
import { InventoryList } from "./pages/Inventory/index";
import { OrderList } from "./pages/Orders/index";
import type { ReactNode } from "react";

const navStyle: React.CSSProperties = {
  background: "#388e3c", padding: "12px 24px",
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
        <Link to="/" style={brandStyle}>User Portal</Link>
        {isAuthenticated && (
          <>
            <Link to="/products" style={linkStyle}>Products</Link>
            <Link to="/inventory" style={linkStyle}>Inventory</Link>
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
            <Link to="/login" style={{ color: "#fff", textDecoration: "none", fontSize: 14 }}>Sign In</Link>
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
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage portalTitle="User Portal" />} />
            <Route path="/register" element={<RegisterPage portalTitle="User Portal" loginPath="/login" />} />
            <Route element={<ProtectedRoute portalType="user" />}>
              <Route path="/" element={<Layout><h1>Dashboard</h1><p>Welcome to the user portal.</p></Layout>} />
              <Route path="/products" element={<Layout><ProductList /></Layout>} />
              <Route path="/inventory" element={<Layout><InventoryList /></Layout>} />
              <Route path="/orders" element={<Layout><OrderList /></Layout>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
