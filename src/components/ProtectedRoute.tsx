import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useRef } from "react";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireGymAdmin?: boolean;
}

const fullPageSpinner = (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

/**
 * Auth + role gate. Loading stays true until profile and roles are resolved (see AuthContext).
 * Admin-first: platform admins never mount the user hub shell — redirect to /admin before children render.
 */
const ProtectedRoute = ({ children, requireAdmin = false, requireGymAdmin = false }: Props) => {
  const { isAuthenticated, user, isAdmin, isGymAdmin, loading } = useAuth();
  const toastShown = useRef(false);

  if (loading) {
    return fullPageSpinner;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  if (isAdmin && !requireAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (requireAdmin && !isAdmin) {
    if (!toastShown.current) {
      toastShown.current = true;
      toast.error("Permission Denied", { description: "You do not have admin access." });
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (requireGymAdmin && !isGymAdmin && !isAdmin) {
    if (!toastShown.current) {
      toastShown.current = true;
      toast.error("Permission Denied", { description: "You do not have gym admin access." });
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (user && !user.onboarded && !requireAdmin && !requireGymAdmin && !isAdmin) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
