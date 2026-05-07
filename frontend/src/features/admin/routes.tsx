import { AdminRootPage } from './AdminRoot';
import { AdminDashboardPage } from './pages/dashboard';
import { AdminNotificationsPage } from './pages/notifications';
import { AdminProfilePage } from './pages/profile-page';
import { AdminTransactionsPage } from './pages/transactions';
import UserRecordPage from './pages/user-records';
import { AdminVendorsPage } from './pages/vendors';

export const adminRoutes = [
  {
    path: 'admin',
    element: <AdminRootPage />,
    children: [
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'profile', element: <AdminProfilePage /> },
      { path: 'vendors', element: <AdminVendorsPage /> },
      { path: 'user_record', element: <UserRecordPage /> },
      { path: 'transactions', element: <AdminTransactionsPage /> },
      {path: 'notifications', element: <AdminNotificationsPage/>}
    ],
  },
];
