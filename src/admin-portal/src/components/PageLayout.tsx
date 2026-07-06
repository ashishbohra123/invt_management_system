import type { ReactNode } from "react";
import { useAuth } from "@moc/shared";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";

interface Crumb {
  label: string;
  path?: string;
}

interface PageLayoutProps {
  children: ReactNode;
  crumbs?: Crumb[];
}

export function PageLayout({ children, crumbs }: PageLayoutProps) {
  const { user, logout } = useAuth();
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AU";

  return (
    <div style={layoutStyle}>
      <Sidebar />
      <main style={mainStyle}>
        <div style={topBarStyle}>
          <div>
            {crumbs && <Breadcrumbs crumbs={crumbs} />}
          </div>
          <div style={userInfoStyle}>
            <span style={userNameStyle}>{user?.name || "Admin User"}</span>
            <div style={avatarStyle}>{initials}</div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

const layoutStyle: React.CSSProperties = {
  display: "flex", minHeight: "100vh",
};
const mainStyle: React.CSSProperties = {
  flex: 1, padding: 32, overflowY: "auto",
  background: "#F8FAFC",
};
const topBarStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  marginBottom: 32,
};
const userInfoStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
};
const userNameStyle: React.CSSProperties = {
  fontSize: 14, color: "#374151",
};
const avatarStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: "50%", background: "#2563EB",
  color: "#fff", display: "flex", alignItems: "center",
  justifyContent: "center", fontWeight: 600, fontSize: 14,
};
