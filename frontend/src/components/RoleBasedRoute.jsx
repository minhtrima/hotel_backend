import { useSelector } from "react-redux";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { canAccessRoute, ROLES } from "../utils/permissions";

export default function RoleBasedRoute() {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If user is customer, show 404
  if (currentUser.user && currentUser.user.role === ROLES.CUSTOMER) {
    return <Navigate to="/404" />;
  }

  // Check if user can access current route
  const canAccess = canAccessRoute(
    currentUser.user || currentUser,
    location.pathname
  );

  if (!canAccess) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
}
