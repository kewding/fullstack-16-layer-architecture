import { AdminRootPage } from './AdminRoot';
import { AdminDashboardPage } from './pages/dashboard';
import { AdminProfilePage } from './pages/profile-page/pages/AdminProfilePage';
import { AdminSettingsPage } from './pages/settings/pages/AdminSettingsPage';
import { AdminTransactionsPage } from './pages/transactions';
import { UserRecordPage } from './pages/user-records/pages/UserRecordPage';

export const adminRoutes = [
  {
    path: 'admin',
    element: <AdminRootPage />,
    children: [
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'profile', element: <AdminProfilePage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'user_record', element: <UserRecordPage /> },
      { path: 'transactions', element: <AdminTransactionsPage /> },
    ],
  },
];
