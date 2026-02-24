import { CashierRootPage } from './CashierRoot';
import { CashierDashboardPage } from './dashboard';

export const cashierRoutes = [
  {
    path: 'cashier',
    element: <CashierRootPage />,
    children: [
      { path: 'dashboard', element: <CashierDashboardPage /> },
    ],
  },
];
