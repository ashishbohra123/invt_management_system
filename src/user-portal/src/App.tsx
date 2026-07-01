import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ProductList } from "./pages/Products/index";
import { InventoryList } from "./pages/Inventory/index";
import { OrderList } from "./pages/Orders/index";

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
        background: "#388e3c", padding: "12px 24px",
        display: "flex", gap: 24, alignItems: "center",
        flexWrap: "wrap",
      }}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
          User Portal
        </Link>
        <Link to="/products" style={{ color: "#fff", textDecoration: "none" }}>Products</Link>
        <Link to="/inventory" style={{ color: "#fff", textDecoration: "none" }}>Inventory</Link>
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
        <Route path="/" element={<Layout><h1>Dashboard</h1><p>Welcome to the user portal.</p></Layout>} />
        <Route path="/products" element={<Layout><ProductList /></Layout>} />
        <Route path="/inventory" element={<Layout><InventoryList /></Layout>} />
        <Route path="/orders" element={<Layout><OrderList /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
