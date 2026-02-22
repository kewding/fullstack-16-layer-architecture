import { BookText, FileText, LayoutGrid, Settings, Users } from 'lucide-react';

export const UserSidebarSections = {
  navMain: [
    { title: 'Dashboard', url: '/user/dashboard', icon: LayoutGrid },
    { title: 'Transactions', url: '/user/transactions', icon: Users },
    { title: 'Users', url: '/user/users', icon: BookText },
    { title: 'Vendors', url: '/user/vendors', icon: FileText },
    { title: 'Settings & Privacy', url: '/user/settings', icon: Settings },
  ],
};
