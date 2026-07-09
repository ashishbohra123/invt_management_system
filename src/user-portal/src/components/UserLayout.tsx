import type { ReactNode } from "react";
import { useAuth } from "@moc/shared";
import { Link, useLocation } from "react-router-dom";

interface UserLayoutProps {
  children: ReactNode;
  sidebar?: boolean;
}

const navItems = [
  { label: "Products", path: "/products" },
  { label: "Inventory", path: "/inventory" },
  { label: "Orders", path: "/orders" },
];

const iconPaths: Record<string, string> = {
  "/products": "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0",
  "/inventory": "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3 8l7-4 7 4 M12 12v6 M9 15h6",
  "/orders": "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z M9 12h6 M9 15h6",
};

export function UserLayout({ children, sidebar }: UserLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "US";

  const isActive = (path: string) => location.pathname.startsWith(path);

  if (sidebar) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={sidebarStyle}>
          <div style={sidebarHeaderStyle}><h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>IMS Portal</h1></div>
          <nav style={navStyle}>
            <div style={sectionTitleStyle}>User Portal</div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...navItemStyle,
                  ...(isActive(item.path) ? activeNavItemStyle : {}),
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d={iconPaths[item.path]} />
                </svg>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main style={mainStyle}>
          <div style={topBarStyle}>
            <div style={{ fontSize: 14, color: "#6B7280" }}>
              <Link to="/portal-select" style={{ color: "#2563EB", textDecoration: "none" }}>Portal Selection</Link>
              <span style={{ color: "#D1D5DB", margin: "0 8px" }}>/</span>
              <span>User Portal</span>
              <span style={{ color: "#D1D5DB", margin: "0 8px" }}>/</span>
              <span>Inventory</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: "#374151" }}>{user?.name || "User"}</span>
              <button onClick={logout} style={logoutBtnStyle}>Sign Out</button>
              <div style={avatarStyle}>{initials}</div>
            </div>
          </div>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "0 32px", display: "flex", alignItems: "center", gap: 32, height: 64 }}>
        <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: "#111", textDecoration: "none" }}>IMS Portal</Link>
        <div style={{ display: "flex", gap: 24, flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                color: isActive(item.path) ? "#2563EB" : "#6B7280",
                textDecoration: "none", fontSize: 14, fontWeight: isActive(item.path) ? 600 : 400,
                borderBottom: isActive(item.path) ? "2px solid #2563EB" : "2px solid transparent",
                padding: "20px 0", transition: "color 0.2s",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, color: "#374151" }}>{user?.name || "User"}</span>
          <button onClick={logout} style={logoutBtnStyle}>Sign Out</button>
          <div style={avatarStyle}>{initials}</div>
        </div>
      </nav>
      <main style={{ padding: 32 }}>{children}</main>
    </div>
  );
}

const sidebarStyle: React.CSSProperties = {
  width: 260, background: "#0F172A", color: "#fff",
  display: "flex", flexDirection: "column", flexShrink: 0,
};
const sidebarHeaderStyle: React.CSSProperties = {
  padding: 24, borderBottom: "1px solid #1E293B",
};
const navStyle: React.CSSProperties = {
  flex: 1, padding: "16px 0", overflowY: "auto",
};
const sectionTitleStyle: React.CSSProperties = {
  padding: "0 24px", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.05em",
  color: "#64748B", marginBottom: 8,
};
const navItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "10px 24px", color: "#94A3B8",
  textDecoration: "none", fontSize: 14,
  transition: "background 0.2s, color 0.2s",
};
const activeNavItemStyle: React.CSSProperties = {
  background: "#1E293B", color: "#fff",
  borderLeft: "3px solid #2563EB",
};
const mainStyle: React.CSSProperties = {
  flex: 1, padding: 32, overflowY: "auto",
  background: "#F8FAFC",
};
const topBarStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  marginBottom: 32, flexWrap: "wrap", gap: 12,
};
const logoutBtnStyle: React.CSSProperties = {
  padding: "6px 14px", border: "1px solid #D1D5DB", borderRadius: 6,
  background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151",
  fontWeight: 500, fontFamily: "inherit",
};
const avatarStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: "50%", background: "#2563EB",
  color: "#fff", display: "flex", alignItems: "center",
  justifyContent: "center", fontWeight: 600, fontSize: 14,
};
