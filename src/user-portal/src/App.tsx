import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { ProductList } from "./pages/Products/index";
import { InventoryList } from "./pages/Inventory/index";
import { OrderList } from "./pages/Orders/index";

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

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <nav style={navStyle}>
        <a href="/" style={brandStyle}>User Portal</a>
        <a href="/products" style={linkStyle}>Products</a>
        <a href="/inventory" style={linkStyle}>Inventory</a>
        <a href="/orders" style={linkStyle}>Orders</a>
      </nav>
      <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>{children}</main>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><h1>Dashboard</h1><p>Welcome to the user portal.</p></Layout>} />
          <Route path="/products" element={<Layout><ProductList /></Layout>} />
          <Route path="/inventory" element={<Layout><InventoryList /></Layout>} />
          <Route path="/orders" element={<Layout><OrderList /></Layout>} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
