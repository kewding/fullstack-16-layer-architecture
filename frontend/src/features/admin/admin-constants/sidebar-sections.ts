import { BookText, FileText, LayoutGrid, Settings, Users } from 'lucide-react';

export const AdminSidebarSections = {
  navMain: [
    { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutGrid },
    { title: 'Transactions', url: '/admin/transactions', icon: Users },
    { title: 'Users', url: '/admin/users', icon: BookText },
    { title: 'Vendors', url: '/admin/vendors', icon: FileText },
    { title: 'Settings & Privacy', url: '/admin/settings', icon: Settings },
  ],
};
