import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { UserList } from "./pages/Users/index.js";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <nav style={{ background: "#1976d2", padding: "12px 24px", display: "flex", gap: 24, alignItems: "center" }}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
          Admin Portal
        </Link>
        <Link to="/users" style={{ color: "#fff", textDecoration: "none" }}>Users</Link>
        <Link to="/products" style={{ color: "#fff", textDecoration: "none" }}>Products</Link>
        <Link to="/orders" style={{ color: "#fff", textDecoration: "none" }}>Orders</Link>
      </nav>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><h1>Dashboard</h1><p>Welcome to the admin portal.</p></Layout>} />
        <Route path="/users" element={<Layout><UserList /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
