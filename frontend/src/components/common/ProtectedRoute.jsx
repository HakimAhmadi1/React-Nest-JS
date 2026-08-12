import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useIsAdmin } from "@/utils/permissions";
import FullPageSpinner from "./FullPageSpinner";

const ProtectedRoute = ({ children, adminOnly = false, permission }) => {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const bootstrapping = useAuthStore((s) => s.bootstrapping);
  const permissions = useAuthStore((s) => s.permissions);
  const isAdmin = useIsAdmin();
  const location = useLocation();

  // Wait for the refresh-cookie exchange before deciding, or a signed-in user
  // gets bounced to /login on every hard reload.
  if (bootstrapping) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    // Encoded, and preserving the query string and hash the old version dropped.
    const target = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
