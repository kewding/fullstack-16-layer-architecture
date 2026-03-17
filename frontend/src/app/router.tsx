import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppLayout } from './layout';
import { RequireAuth } from './routes/RequireAuth';

import { adminRoutes } from '@/features/admin/routes';
import { authRoutes } from '@/features/auth/routes';
import { cashierRoutes } from '@/features/cashier/routes';
import { userRoutes } from '@/features/user/routes';
import { unauthorizedRoutes } from '@/pages/errors/routes';

const allRoutes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: '',
        index: true,
        element: <Navigate to="/login" replace />,
      },

      // public routes: Login and Register
      ...authRoutes,

      // error pages
      ...unauthorizedRoutes,

      // --- Protected Routes with Strict Role Access ---
      {
        element: <RequireAuth allowedRoles={[1]} />,
        children: [...adminRoutes],
      },
      {
        element: <RequireAuth allowedRoles={[2]} />,
        children: [...userRoutes],
      },
      {
        element: <RequireAuth allowedRoles={[4]} />,
        children: [...cashierRoutes],
      },
    ],
  },
];

const router = createBrowserRouter(allRoutes);

export function Router() {
  return <RouterProvider router={router} />;
}
