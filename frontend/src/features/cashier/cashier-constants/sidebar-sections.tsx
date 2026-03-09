import { LayoutGrid, Settings, Users } from 'lucide-react';

export const CashierSidebarSections = {
  navMain: [
    { title: 'Dashboard', url: '/cashier/dashboard', icon: LayoutGrid },
    { title: 'Tagging', url: '/cashier/rfid-tagging', icon: Users },
    { title: 'Settings & Privacy', url: '/cashier/settings', icon: Settings },
  ],
};
