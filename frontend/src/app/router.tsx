import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppLayout } from './layout';
import { RequireAuth } from './routes/RequireAuth';

import { adminRoutes } from '@/features/admin/routes';
import { authRoutes } from '@/features/auth/routes';
import { cashierRoutes } from '@/features/cashier/routes';
import { userRoutes } from '@/features/user/routes';

/**
 * Role ID Mapping (Derived from user_roles schema):
 * 1: Admin
 * 2: Customer (User Section)
 * 3: Vendor (Stall Owner)
 * 4: Cashier (Distinct from Vendor)
 */

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

      // --- Protected Routes with Strict Role Access ---
      {
        // admin only section
        element: <RequireAuth allowedRoles={[1]} />,
        children: [...adminRoutes],
      },

      {
        // customer only section (User Routes)
        element: <RequireAuth allowedRoles={[2]} />,
        children: [...userRoutes],
      },

      {
        // cashier only section
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
