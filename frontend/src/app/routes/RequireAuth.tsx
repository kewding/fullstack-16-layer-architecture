import { useAuth } from '@/app/providers/AuthProvider';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

//guards routes in this sub-tree by requiring authentication
export function RequireAuth({ allowedRoles }: { allowedRoles?: number[] }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.roleId || 0)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}