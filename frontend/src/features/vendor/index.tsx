import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import { VendorSidebar } from './vendor-components/Sidebar';
import { SiteHeader } from './vendor-components/SiteHeader';

export function VendorRootPage() {
  return (
    <div className="w-screen h-screen overflow-x-auto">
      <SidebarProvider className="flex min-w-0" style={{ "--sidebar-width": "12rem" } as React.CSSProperties}>
        <VendorSidebar variant="inset" className=''/>
        <SidebarInset className='flex p-6 gap-1 bg'>
          <SiteHeader />
          <section className='overflow-x-auto'>
            <Outlet />
          </section>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
