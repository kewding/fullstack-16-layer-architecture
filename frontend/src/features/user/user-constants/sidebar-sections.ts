import { BookText, FileText, LayoutGrid, Settings, Users } from 'lucide-react';

export const UserSidebarSections = {
  navMain: [
    { title: 'Dashboard', url: '/user/dashboard', icon: LayoutGrid },
    { title: 'Transactions', url: '/user/transactions', icon: Users },
    { title: 'Medical Information', url: '/user/medical_information', icon: BookText },
    { title: 'Profile', url: '/user/profile', icon: FileText },
    { title: 'Settings & Privacy', url: '/user/settings', icon: Settings },
  ],
};
