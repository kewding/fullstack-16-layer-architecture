import { useAuth } from '@/app/providers/AuthProvider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { loginService } from '@/features/auth/login/services/login.service';
import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AdminSidebarSections } from '../admin-constants/sidebar-sections';

function useNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // initial fetch
    fetch('/api/admin/notifications/unread-count')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUnreadCount(json.data.count);
      })
      .catch(() => {});

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/admin/notifications/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (typeof data.unread_count === 'number') {
          setUnreadCount(data.unread_count);
        }
      } catch {}
    };

    ws.onerror = () => ws.close();

    return () => ws.close();
  }, []);

  return unreadCount;
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { logout } = useAuth();
  const unreadCount = useNotificationCount();

  const handleLogout = async () => {
    await loginService.logout();
    logout();
    window.location.replace('/login');
  };

  return (
    <Sidebar collapsible="icon" {...props} className="pr-0">
      <SidebarContent className="py-20">
        <SidebarGroup>
          <SidebarMenu className="flex flex-col gap-1">
            {AdminSidebarSections.navMain.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.url;
              const isNotifications = item.url === '/admin/notifications';

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    // className={`flex flex-row w-full h-[3rem] justify-stretch gap-2 p-3 transition-colors ${
                    //   isActive ? '!bg-[#E3EDEC] !text-[#415B5A]' : 'hover:bg-sidebar-accent/50'
                    // }`}
                    className={`flex h-[3rem] w-full flex-row gap-2 p-3 transition-colors ${
                      isActive ? '!bg-[#E3EDEC]' : 'hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <NavLink to={item.url}>
                      <Icon className="text-current" />
                      {/* unread badge — only on notifications item */}
                      {isNotifications && unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                      <span className="font-normal no-underline">{item.title}</span>
                      {/* inline count when sidebar is expanded */}
                      {isNotifications && unreadCount > 0 && (
                        <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={handleLogout}
              className="flex flex-row w-full h-[3rem] justify-stretch gap-2 p-3 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="shrink-0" />
              <span className="font-normal">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
