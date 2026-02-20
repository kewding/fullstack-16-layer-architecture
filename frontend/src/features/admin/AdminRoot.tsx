import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './admin-components/Sidebar';
import { SiteHeader } from './admin-components/SiteHeader';

export function AdminRootPage() {
  return (
    <div className="w-screen h-screen">
      <SidebarProvider className="w-full" style={{ "--sidebar-width": "12rem" } as React.CSSProperties}>
        <AdminSidebar variant="inset"/>
        <SidebarInset className='p-6 gap-1 bg-black'>
          <SiteHeader />
          <section>
            <Outlet />
          </section>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
