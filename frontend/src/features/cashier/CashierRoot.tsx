
import { Outlet } from 'react-router-dom';
import { CashierSidebar } from './cashier-components/Sidebar';
import { SiteHeader } from './cashier-components/SiteHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export function CashierRootPage() {
  return (
    <div className="w-screen h-screen overflow-x-auto">
      <SidebarProvider className="flex min-w-0" style={{ "--sidebar-width": "12rem" } as React.CSSProperties}>
        <CashierSidebar variant="inset" className=''/>
        <SidebarInset className='flex p-6 gap-1 bg-black'>
          <SiteHeader />
          <section className='overflow-x-auto'>
            <Outlet />
          </section>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
