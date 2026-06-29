import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <nav style={{
        background: "#7b1fa2", padding: "12px 24px",
        display: "flex", gap: 24, alignItems: "center",
        flexWrap: "wrap",
      }}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
          Customer Portal
        </Link>
        <Link to="/profile" style={{ color: "#fff", textDecoration: "none" }}>Profile</Link>
      </nav>
      <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>{children}</main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><h1>Customer Dashboard</h1><p>Welcome to the customer portal. Browse products and manage your orders.</p></Layout>} />
        <Route path="/profile" element={<Layout><h1>My Profile</h1><p>Manage your account information and preferences.</p></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
