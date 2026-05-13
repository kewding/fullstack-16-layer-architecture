import { VendorRootPage } from '.';
import { BusinessInformationPage } from './pages/business-information';
import { VendorDashboardPage } from './pages/dashboard';
import { VendorWithdrawalPage } from './pages/remittance';

export const vendorRoutes = [
  {
    path: 'vendor',
    element: <VendorRootPage />,
    children: [
      { path: 'dashboard', element: <VendorDashboardPage /> },
      { path: 'remittance', element: <VendorWithdrawalPage /> },
      { path: 'business_information', element: <BusinessInformationPage /> },
    ],
  },
];
