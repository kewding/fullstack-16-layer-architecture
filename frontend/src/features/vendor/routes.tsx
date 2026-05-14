import { VendorRootPage } from '.';
import { BusinessInformationPage } from './pages/business-information';
import { VendorDashboardPage } from './pages/dashboard';
import { VendorWithdrawPage } from './pages/remittance/';
import { VendorTransactionsPage } from './pages/transactions';

export const vendorRoutes = [
  {
    path: 'vendor',
    element: <VendorRootPage />,
    children: [
      { path: 'dashboard', element: <VendorDashboardPage /> },
      { path: 'remittance', element: <VendorWithdrawPage /> },
      { path: 'transactions', element: <VendorTransactionsPage /> },
      { path: 'business_information', element: <BusinessInformationPage /> },
    ],
  },
];
