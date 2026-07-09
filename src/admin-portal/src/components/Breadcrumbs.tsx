import { Link } from "react-router-dom";

interface Crumb {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
}

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  return (
    <div style={breadcrumbStyle}>
      {crumbs.map((crumb, i) => (
        <span key={i}>
          {i > 0 && <span style={{ color: "#D1D5DB", margin: "0 8px" }}>/</span>}
          {crumb.path ? (
            <Link to={crumb.path} style={linkStyle}>{crumb.label}</Link>
          ) : (
            <span style={{ color: "#6B7280" }}>{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

const breadcrumbStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", fontSize: 14, color: "#6B7280",
};
const linkStyle: React.CSSProperties = {
  color: "#2563EB", textDecoration: "none",
};
