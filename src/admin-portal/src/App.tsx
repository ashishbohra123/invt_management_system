import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute, LoginPage, RegisterPage, PortalSelectionPage } from "@moc/shared";
import { UserList } from "./pages/Users/index.js";
import { TenantList } from "./pages/Tenants/index.js";
import { PageLayout } from "./components/PageLayout";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<LoginPage portalTitle="Admin Portal" registerPath="/admin/register" portalSelectPath="/admin/portal-select" />} />
          <Route path="/admin/register" element={<RegisterPage portalTitle="Admin Portal" loginPath="/admin/login" portalSelectPath="/admin/portal-select" />} />
          <Route path="/admin/portal-select" element={<ProtectedRoute portalType="admin" />}>
            <Route index element={<PortalSelectionPage />} />
          </Route>
          <Route element={<ProtectedRoute portalType="admin" />}>
            <Route path="/" element={<PageLayout><h1 style={pageTitleStyle}>Dashboard</h1><p>Welcome to the admin portal.</p></PageLayout>} />
            <Route path="/users" element={<PageLayout crumbs={[{ label: "Admin Portal" }, { label: "User Management" }]}><UserList /></PageLayout>} />
            <Route path="/tenants" element={<PageLayout crumbs={[{ label: "Admin Portal" }, { label: "Tenant Management" }]}><TenantList /></PageLayout>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: 24, fontWeight: 600, color: "#111", margin: 0,
};
