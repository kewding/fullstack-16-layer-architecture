import { ArrowDownLeft, Bell, BookText, FileText, LayoutGrid, Settings, Users, WalletMinimal } from 'lucide-react';

export const UserSidebarSections = {
  navMain: [
    { title: 'Dashboard', url: '/user/dashboard', icon: LayoutGrid },
    { title: 'Top-up', url: '/user/top-up', icon: WalletMinimal },
    { title: 'Withdraw', url: '/user/withdraw', icon: ArrowDownLeft },
    { title: 'Transactions', url: '/user/transactions', icon: Users },
    { title: 'Medical Information', url: '/user/medical_information', icon: BookText },
    { title: 'Profile', url: '/user/profile', icon: FileText },
    { title: 'Notifications', url: '/user/notifications', icon: Bell },
    { title: 'Settings & Privacy', url: '/user/settings', icon: Settings },
  ],
};
