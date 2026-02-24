import { LayoutGrid, Settings, Users } from 'lucide-react';

export const CashierSidebarSections = {
  navMain: [
    { title: 'Dashboard', url: '/cashier/dashboard', icon: LayoutGrid },
    { title: 'Transactions', url: '/cashier/transactions', icon: Users },
    { title: 'Settings & Privacy', url: '/cashier/settings', icon: Settings },
  ],
};
