import { useAuth } from '@/app/providers/AuthProvider';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

//guards routes in this sub-tree by requiring authentication
export function RequireAuth({ allowedRoles }: { allowedRoles?: number[] }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="w-screen h-screen bg-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
          <p className="text-neutral-400 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.roleId ?? 0)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
