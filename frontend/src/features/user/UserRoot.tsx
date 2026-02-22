import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import { UserSidebar } from './pages/user-components/Sidebar';
import { SiteHeader } from './pages/user-components/SiteHeader';

export function UserRootPage() {
  return (
    <div className="w-screen h-screen overflow-x-auto">
      <SidebarProvider className="flex min-w-0" style={{ "--sidebar-width": "12rem" } as React.CSSProperties}>
        <UserSidebar variant="inset" className=''/>
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
