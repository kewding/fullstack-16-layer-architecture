import { CashierRootPage } from './CashierRoot';
import { CashierVendorRemitPage } from './pages/remit';
// import { CashierDashboardPage } from './pages/dashboard';
import { CashierTopUpPage } from './pages/top-up';
import { CashierWithdrawPage } from './pages/withdraw';

export const cashierRoutes = [
  {
    path: 'cashier',
    element: <CashierRootPage />,
    children: [
      // { path: 'dashboard', element: <CashierDashboardPage /> },
      // { path: 'rfid-tagging', element: <CashierRfidTaggingPage/>},
      { path: 'top-up', element: <CashierTopUpPage /> },
      { path: 'withdraw', element: <CashierWithdrawPage /> },
      { path: 'remit', element: <CashierVendorRemitPage/> },
    ],
  },
];
