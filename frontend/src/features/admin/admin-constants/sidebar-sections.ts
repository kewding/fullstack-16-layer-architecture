import { Bell, BookText, FileText, LayoutGrid, Settings, Users } from 'lucide-react';

export const AdminSidebarSections = {
  navMain: [
    { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutGrid },
    { title: 'Transactions', url: '/admin/transactions', icon: Users },
    { title: 'Users', url: '/admin/user_record', icon: BookText },
    { title: 'Vendors', url: '/admin/vendors', icon: FileText },
    { title: 'Notifications', url: '/admin/notifications', icon: Bell },
    { title: 'Profile', url: '/admin/profile', icon: Settings },

  ],
};

