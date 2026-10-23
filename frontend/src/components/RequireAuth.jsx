import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth";

/* Guards a route behind a signed-in session, and optionally a role.

   It waits for AuthContext to finish asking /auth/me before deciding: on a full
   page load the user is null until that answer arrives, and redirecting on that
   null sent people who were signed in to the login page. Whoever is sent to log
   in carries the page they asked for, so LoginPage can bring them back to it. */
function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default RequireAuth;
