import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './admin-components/Sidebar';

export function AdminRootPage() {
  return (
    <div className='px-6 py-4'>
      <SidebarProvider>
        <AdminSidebar />
        <main>
          <SidebarTrigger />
          <Outlet />
        </main>
      </SidebarProvider>
    </div>
  );
}
