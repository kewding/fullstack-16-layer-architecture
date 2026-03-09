import { CashierRootPage } from './CashierRoot';
import { CashierDashboardPage } from './dashboard';
import { CashierRfidTaggingPage } from './rfid-tagging';

export const cashierRoutes = [
  {
    path: 'cashier',
    element: <CashierRootPage />,
    children: [
      { path: 'dashboard', element: <CashierDashboardPage /> },
      { path: 'rfid-tagging', element: <CashierRfidTaggingPage/>}
    ],
  },
];
