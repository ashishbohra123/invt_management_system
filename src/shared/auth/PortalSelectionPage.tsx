import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.js";

const portalConfig: Record<string, { title: string; description: string; color: string; url: string; features: string[] }> = {
  admin: {
    title: "Admin Portal",
    description: "Manage users, tenants, and system-wide settings",
    color: "#2563eb",
    url: "/",
    features: ["User & role management", "Tenant administration", "System configuration"],
  },
  user: {
    title: "User Portal",
    description: "Browse products, manage inventory and orders",
    color: "#16a34a",
    url: "http://localhost:3002",
    features: ["Product catalog", "Inventory tracking", "Order management"],
  },
};

export function PortalSelectionPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const portalAccess: string[] = user?.portalAccess ?? [];

  const isAdminRoute = location.pathname.includes("/admin/");
  const visiblePortals = portalAccess.length > 0
    ? portalAccess.filter((p) => portalConfig[p]).map((p) => portalConfig[p])
    : Object.values(portalConfig);

  function handlePortalClick(portal: (typeof visiblePortals)[number]) {
    if (isAdminRoute || portal.url === "/") {
      navigate(portal.url);
    } else {
      window.location.href = portal.url;
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={brandSectionStyle}>
          <div style={{ ...brandDotStyle, background: "#2563eb" }} />
          <span style={brandTextStyle}>MOC</span>
        </div>
        <div style={userSectionStyle}>
          <span style={userNameStyle}>{user?.name || user?.email || "User"}</span>
          <button onClick={logout} style={logoutBtnStyle}>Sign Out</button>
        </div>
      </div>

      <div style={contentStyle}>
        <div style={heroStyle}>
          <h1 style={heroTitleStyle}>
            Welcome{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p style={heroSubStyle}>Select a portal to access your workspace</p>
        </div>

        <div style={tilesGridStyle}>
          {visiblePortals.length === 0 && (
            <div style={emptyStateStyle}>
              <p>You don't have access to any portals yet.</p>
              <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
                Contact your administrator to get access.
              </p>
            </div>
          )}
          {visiblePortals.map((portal) => (
            <button
              key={portal.title}
              onClick={() => handlePortalClick(portal)}
              style={tileBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = portal.color;
                e.currentTarget.style.boxShadow = `0 8px 30px ${portal.color}1A`;
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div style={{ ...iconCircleStyle, background: portal.color }}>
                {portal.title.charAt(0)}
              </div>
              <h3 style={tileTitleStyle}>{portal.title}</h3>
              <p style={tileDescStyle}>{portal.description}</p>
              <div style={featureListStyle}>
                {portal.features.map((f) => (
                  <div key={f} style={featureItemStyle}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M11.667 3.5L5.25 9.917 2.333 7" stroke={portal.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ ...accessBadgeStyle, background: portal.color }}>
                Open {portal.title}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f9fafb",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 40px",
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
};

const brandSectionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const brandDotStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
};

const brandTextStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: 1,
  color: "#111",
};

const userSectionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const userNameStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
};

const logoutBtnStyle: React.CSSProperties = {
  padding: "7px 16px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
  color: "#374151",
  fontWeight: 500,
};

const contentStyle: React.CSSProperties = {
  maxWidth: 800,
  margin: "0 auto",
  padding: "48px 24px",
};

const heroStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: 48,
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
  margin: 0,
  color: "#111",
};

const heroSubStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#6b7280",
  margin: "8px 0 0",
};

const tilesGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 24,
};

const emptyStateStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  textAlign: "center",
  padding: 48,
  color: "#6b7280",
};

const tileBtnStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 32,
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  textAlign: "center",
  transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};

const iconCircleStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  color: "#fff",
  fontWeight: 700,
  flexShrink: 0,
};

const tileTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: "#111",
};

const tileDescStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.5,
};

const featureListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  width: "100%",
  marginTop: 4,
};

const featureItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#4b5563",
};

const accessBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 20px",
  borderRadius: 20,
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  marginTop: 8,
};

