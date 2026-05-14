import { ArrowDownLeft, BookText, LayoutGrid } from 'lucide-react';

export const VendorSidebarSections = {
  navMain: [
    { title: 'Dashboard', url: '/vendor/dashboard', icon: LayoutGrid },
    { title: 'Remit', url: '/vendor/remittance', icon: ArrowDownLeft },
    { title: 'Transactions', url: '/vendor/transactions', icon: ArrowDownLeft },
    { title: 'Business Information', url: '/vendor/business_information', icon: BookText },
  ],
};
