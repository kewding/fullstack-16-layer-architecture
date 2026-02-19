import { AdminRootPage } from './AdminRoot';
import { AdminDashboardPage } from './dashboard/pages/AdminDashboardPage';
import { AdminProfilePage } from './profile-page/pages/AdminProfilePage';
import { AdminSettingsPage } from './settings/pages/AdminSettingsPage';
import { AdminTransactionsPage } from './transaction/pages/AdminTransactionsPage';
import { UserRecordPage } from './user-records/pages/UserRecordPage';

export const adminRoutes = [
  {
    path: 'admin',
    element: <AdminRootPage />,
    children: [
      { path: 'admin/dashboard', element: <AdminDashboardPage /> },
      { path: 'admin/profile', element: <AdminProfilePage /> },
      { path: 'admin/settings', element: <AdminSettingsPage /> },
      { path: 'admin/user_record', element: <UserRecordPage /> },
      { path: 'admin/transactions', element: <AdminTransactionsPage /> },
    ],
  },
];
