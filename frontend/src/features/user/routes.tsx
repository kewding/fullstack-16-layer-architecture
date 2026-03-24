import { UserDashboardPage } from './dashboard';
import { MedicalInformationPage } from './pages/MedicalInformationPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { UserSettingPage } from './pages/UserSettingPage';
import { UserRootPage } from './UserRoot';

export const userRoutes = [
  {
    path: 'user',
    element: <UserRootPage />,
    children: [
      { path: 'medical_information', element: <MedicalInformationPage /> },
      { path: 'transactions', element: <TransactionHistoryPage /> },
      { path: 'dashboard', element: <UserDashboardPage /> },
      { path: 'settings', element: <UserSettingPage /> },
      { path: 'profile', element: <UserProfilePage /> },
    ],
  },
];
