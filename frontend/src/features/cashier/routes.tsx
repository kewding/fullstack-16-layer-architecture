import { CashierRootPage } from './CashierRoot';
// import { CashierDashboardPage } from './pages/dashboard';
import { CashierRfidTaggingPage } from './pages/rfid-tagging';
import { CashierTopUpPage } from './pages/top-up';

export const cashierRoutes = [
  {
    path: 'cashier',
    element: <CashierRootPage />,
    children: [
      // { path: 'dashboard', element: <CashierDashboardPage /> },
      { path: 'rfid-tagging', element: <CashierRfidTaggingPage/>},
      {path: 'top-up', element: <CashierTopUpPage/>}
    ],
  },
];
