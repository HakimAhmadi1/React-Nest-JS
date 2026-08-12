import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import MainLayout from "./layouts/MainLayout";
import AccountLayout from "./layouts/AccountLayout";
import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import SupportPage from "./pages/common/SupportPage";
import NotFound from "./pages/common/NotFound";
import Profile from "./pages/account/Profile";

import ProtectedRoute from "./components/common/ProtectedRoute";
import FullPageSpinner from "./components/common/FullPageSpinner";
import { useAuthBootstrap } from "./hooks/useAuth";
import { useAuthStore } from "./store/authStore";
import { useIsAdmin } from "./utils/permissions";

// The admin portal is only reachable by a minority of users; splitting it out
// keeps it out of the initial bundle.
const AdminLayout = lazy(() => import("./layouts/admin/AdminLayout"));
const DashboardPage = lazy(() => import("./modules/admin/dashboard/DashboardPage"));
const UsersPage = lazy(() => import("./modules/admin/users/UsersPage"));
const MediaPage = lazy(() => import("./modules/admin/media/MediaPage"));
const SettingsPage = lazy(() => import("./modules/admin/settings/SettingsPage"));

/** Admins landing on `/` go straight to the portal. */
const HomeRedirect = () => {
  const bootstrapping = useAuthStore((s) => s.bootstrapping);
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const isAdmin = useIsAdmin();

  if (bootstrapping) return <FullPageSpinner />;
  if (isAuthenticated && isAdmin) return <Navigate to="/admin" replace />;
  return <Home />;
};

function App() {
  // Exchanges the httpOnly refresh cookie for an access token on load.
  useAuthBootstrap();

  return (
    <>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />

            <Route path="contact" element={<SupportPage />} />
            <Route path="about" element={<SupportPage />} />
            <Route path="privacy" element={<SupportPage />} />
            <Route path="terms" element={<SupportPage />} />
            <Route path="support" element={<SupportPage />} />

            <Route
              path="account"
              element={
                <ProtectedRoute>
                  <AccountLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route
              path="users"
              element={
                <ProtectedRoute adminOnly permission="user.view">
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="media"
              element={
                <ProtectedRoute adminOnly permission="upload.view">
                  <MediaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute adminOnly permission="settings.view">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid #27272a",
          },
        }}
      />
    </>
  );
}

export default App;
