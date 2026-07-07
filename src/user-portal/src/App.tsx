import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute, LoginPage, RegisterPage, PortalSelectionPage, ToastProvider } from "@moc/shared";
import { ProductList } from "./pages/Products/index.js";
import { InventoryList } from "./pages/Inventory/index.js";
import { OrderList } from "./pages/Orders/index.js";
import { UserLayout } from "./components/UserLayout.js";

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage portalTitle="User Portal" />} />
            <Route path="/register" element={<RegisterPage portalTitle="User Portal" />} />
            <Route path="/portal-select" element={<ProtectedRoute portalType="user" />}>
              <Route index element={<PortalSelectionPage />} />
            </Route>
            <Route element={<ProtectedRoute portalType="user" />}>
              <Route path="/" element={<UserLayout><h1 style={pageTitleStyle}>Dashboard</h1><p>Welcome to the user portal.</p></UserLayout>} />
              <Route path="/products" element={<UserLayout><ProductList /></UserLayout>} />
              <Route path="/inventory" element={<UserLayout sidebar><InventoryList /></UserLayout>} />
              <Route path="/orders" element={<UserLayout><OrderList /></UserLayout>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: 24, fontWeight: 600, color: "#111", margin: 0,
};
