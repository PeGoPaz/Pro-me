import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import AppFooter from "./components/AppFooter";
import AppHeader from "./components/AppHeader";
import RequireAuth from "./components/RequireAuth";
import AdminPage from "./pages/AdminPage";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import HomePage from "./pages/HomePage";
import InstructorOnboardingPage from "./pages/InstructorOnboardingPage";
import InstructorProfilePage from "./pages/InstructorProfilePage";
import InstructorSearchPage from "./pages/InstructorSearchPage";
import LoginPage from "./pages/LoginPage";
import ProviderDashboardPage from "./pages/ProviderDashboardPage";
import PrivacyPage from "./pages/PrivacyPage";
import ProviderProfile from "./pages/ProviderProfile";
import RegisterPage from "./pages/RegisterPage";
import TermsPage from "./pages/TermsPage";

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
        <Route path="/instructors" element={<MainLayout><InstructorSearchPage /></MainLayout>} />
        <Route path="/onboarding" element={<MainLayout><InstructorOnboardingPage /></MainLayout>} />
        <Route path="/admin" element={<MainLayout><AdminPage /></MainLayout>} />
        <Route path="/instructors/:instructorId" element={<MainLayout><InstructorProfilePage /></MainLayout>} />
        {/* Kept for the Other category, which has no profile of its own yet.
            Driving instructors live at /instructors/:instructorId. */}
        <Route path="/providers/:providerId" element={<MainLayout><ProviderProfile /></MainLayout>} />
        <Route path="/booking" element={<MainLayout><RequireAuth role="user"><BookingPage /></RequireAuth></MainLayout>} />
        <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
        <Route path="/terms" element={<MainLayout><TermsPage /></MainLayout>} />
        <Route path="/privacy" element={<MainLayout><PrivacyPage /></MainLayout>} />
        <Route
          path="/dashboard/customer"
          element={<MainLayout><RequireAuth><CustomerDashboardPage /></RequireAuth></MainLayout>}
        />
        <Route
          path="/dashboard/provider"
          element={<MainLayout><RequireAuth><ProviderDashboardPage /></RequireAuth></MainLayout>}
        />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
