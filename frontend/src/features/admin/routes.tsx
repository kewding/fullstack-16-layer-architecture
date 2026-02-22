import { AdminRootPage } from './AdminRoot';
import { AdminDashboardPage } from './dashboard';
import { AdminProfilePage } from './profile-page/pages/AdminProfilePage';
import { AdminSettingsPage } from './settings/pages/AdminSettingsPage';
import { AdminTransactionsPage } from './transactions';
import { UserRecordPage } from './user-records/pages/UserRecordPage';

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
