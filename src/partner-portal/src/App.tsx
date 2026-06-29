import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <nav style={{
        background: "#388e3c", padding: "12px 24px",
        display: "flex", gap: 24, alignItems: "center",
        flexWrap: "wrap",
      }}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
          Partner Portal
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
        <Route path="/" element={<Layout><h1>Partner Dashboard</h1><p>Welcome to the partner portal. Manage your inventory and orders here.</p></Layout>} />
        <Route path="/profile" element={<Layout><h1>Partner Profile</h1><p>View and manage your partner account details.</p></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
