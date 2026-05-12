import { UserDashboardPage } from './pages/dashboard';
import { MedicalInformationPage } from './pages/medical-info';
import { UserNotificationsPage } from './pages/notification-page';
import { UserProfilePage } from './pages/profile-page';
import { UserTopUpPage } from './pages/top-up';
import { TransactionHistoryPage } from './pages/transaction-history';
import { UserSettingPage } from './pages/UserSettingPage';
import { UserRootPage } from './UserRoot';

export const userRoutes = [
  {
    path: 'user',
    element: <UserRootPage />,
    children: [
      { path: 'medical_information', element: <MedicalInformationPage /> },
      { path: 'top-up', element: <UserTopUpPage /> },
      { path: 'notifications', element: <UserNotificationsPage /> },
      { path: 'transactions', element: <TransactionHistoryPage /> },
      { path: 'dashboard', element: <UserDashboardPage /> },
      { path: 'settings', element: <UserSettingPage /> },
      { path: 'profile', element: <UserProfilePage /> },
    ],
  },
];
