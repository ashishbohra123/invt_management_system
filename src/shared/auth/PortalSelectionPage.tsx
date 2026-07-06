import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.js";
import { Card, CardContent, Button } from "../components/ui/index.js";

const portalConfig: Record<string, { title: string; description: string; color: string; url: string }> = {
  admin: {
    title: "Admin Portal",
    description: "Manage users, tenants, and system settings",
    color: "#1976d2",
    url: "http://localhost:3001",
  },
  user: {
    title: "User Portal",
    description: "Browse products, manage inventory and orders",
    color: "#388e3c",
    url: "http://localhost:3002",
  },
};

export function PortalSelectionPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const portalAccess: string[] = user?.portalAccess ?? [];

  const visiblePortals = portalAccess.length > 0
    ? portalAccess.filter((p) => portalConfig[p]).map((p) => portalConfig[p])
    : Object.values(portalConfig);

  const handlePortalClick = (url: string, title: string) => {
    if (title === "Admin Portal" && url.includes("localhost:3001")) {
      navigate("/");
    } else {
      window.location.href = url;
    }
  };

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        minHeight: "100vh", background: "#f0f2f5", padding: 24,
      }}
    >
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, margin: 0, color: "#222" }}>Welcome{user?.name ? `, ${user.name}` : ""}</h1>
        <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>Select a portal to continue</p>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {visiblePortals.map((portal) => (
          <Card
            key={portal.title}
            style={{
              width: 280, cursor: "pointer",
              transition: "box-shadow 0.2s, transform 0.2s",
              border: `1px solid ${portal.color}33`,
            }}
            onClick={() => handlePortalClick(portal.url, portal.title)}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.boxShadow = `0 4px 20px ${portal.color}33`;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "none";
            }}
          >
            <CardContent style={{ textAlign: "center", padding: 32 }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: portal.color, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", fontSize: 20, color: "#fff", fontWeight: 700,
                }}
              >
                {portal.title.charAt(0)}
              </div>
              <h2 style={{ fontSize: 18, margin: "0 0 8px", color: portal.color }}>
                {portal.title}
              </h2>
              <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.5 }}>
                {portal.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 32 }}>
        <Button variant="secondary" onClick={logout}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
