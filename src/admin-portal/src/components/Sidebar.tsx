import { Link, useLocation } from "react-router-dom";

const navItems = [
  {
    section: "Admin",
    items: [
      {
        label: "User Management",
        path: "/users",
        icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
      },
      {
        label: "Tenant Management",
        path: "/tenants",
        icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3 16v-4.5l7-4 7 4V16 M3 8l7-4 7 4",
      },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside style={sidebarStyle}>
      <div style={headerStyle}>
        <h1 style={brandStyle}>IMS Portal</h1>
      </div>
      <nav style={navStyle}>
        {navItems.map((section) => (
          <div key={section.section} style={sectionStyle}>
            <div style={sectionTitleStyle}>{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...navItemStyle,
                  ...(location.pathname.startsWith(item.path) ? activeNavItemStyle : {}),
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

const sidebarStyle: React.CSSProperties = {
  width: 260, background: "#0F172A", color: "#fff",
  display: "flex", flexDirection: "column", flexShrink: 0,
};
const headerStyle: React.CSSProperties = {
  padding: 24, borderBottom: "1px solid #1E293B",
};
const brandStyle: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, margin: 0,
};
const navStyle: React.CSSProperties = {
  flex: 1, padding: "16px 0", overflowY: "auto",
};
const sectionStyle: React.CSSProperties = {
  marginBottom: 24,
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
};
