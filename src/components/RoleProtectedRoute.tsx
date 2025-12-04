import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, AppRole } from "@/hooks/useUserRole";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

const RoleProtectedRoute = ({ 
  children, 
  allowedRoles, 
  redirectTo = "/dashboard" 
}: RoleProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { canAccess, isCheckinOperator } = useUserRole();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  if (!canAccess(allowedRoles)) {
    // Operador de check-in é redirecionado para /events
    const fallbackPath = isCheckinOperator ? "/events" : redirectTo;
    return <Navigate to={fallbackPath} replace />;
  }
  
  return <>{children}</>;
};

export default RoleProtectedRoute;
