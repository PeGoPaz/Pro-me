import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppFooter from "./components/AppFooter";
import AppHeader from "./components/AppHeader";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProviderDashboardPage from "./pages/ProviderDashboardPage";
import ProviderListingsPage from "./pages/ProviderListingsPage";
import ProviderProfile from "./pages/ProviderProfile";
import RegisterPage from "./pages/RegisterPage";
import ServicesDashboardPage from "./pages/ServicesDashboardPage";

/*
 * MainLayout — shared shell for all pages that show the header and footer.
 * Auth pages (Login, Register) render without this wrapper so users see
 * only the form, with no navigation chrome.
 */
function MainLayout({ children }) {
  return (
    <div className="page">
      <AppHeader />
      <main>{children}</main>
      <AppFooter />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Auth routes — full-screen, no header or footer */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main app routes — wrapped with header and footer */}
        <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
        <Route path="/providers" element={<MainLayout><ProviderListingsPage /></MainLayout>} />
        <Route path="/providers/:providerId" element={<MainLayout><ProviderProfile /></MainLayout>} />
        <Route path="/services" element={<MainLayout><ServicesDashboardPage /></MainLayout>} />
        <Route path="/booking" element={<MainLayout><BookingPage /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
        <Route
          path="/dashboard/customer"
          element={<MainLayout><CustomerDashboardPage /></MainLayout>}
        />
        <Route
          path="/dashboard/provider"
          element={<MainLayout><ProviderDashboardPage /></MainLayout>}
        />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
