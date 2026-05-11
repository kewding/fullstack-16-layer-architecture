import { useAuth } from '@/app/providers/AuthProvider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { loginService } from '@/features/auth/login/services/login.service';
import { LogOut } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { UserSidebarSections } from '../user-constants/sidebar-sections';
import { notificationBus } from '@/lib/notificationBus';
import { useEffect, useState } from 'react';

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

    // WebSocket for real-time updates from other admins
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

  // Subscribe to manual triggers (disable/reactivate actions on this tab)
  useEffect(() => {
    return notificationBus.subscribe(() => {
      fetch('/api/admin/notifications/unread-count')
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setUnreadCount(json.data.count);
        })
        .catch(() => {});
    });
  }, []);

  return unreadCount;
}

export function UserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { logout } = useAuth();
  // const navigate = useNavigate();
  const unreadCount = useNotificationCount();
  const { state } = useSidebar();

  const handleLogout = async () => {
    await loginService.logout();
    logout();
    window.location.replace('/login');
  };

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" {...props} className="pr-0">
      <SidebarContent className="py-20">
        <SidebarGroup>
          {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
          <SidebarMenu className="flex flex-col gap-1">
            {/* sidebar sections */}
            {UserSidebarSections.navMain.map((item) => {
              // since icons are not saved as jsx
              const Icon = item.icon;
              // checks whether url of active path
              const isActive = location.pathname === item.url;
              const isNotifications = item.url === '/user/notifications';

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    // className={`flex flex-row w-full h-[3rem] justify-stretch gap-2 p-3 transition-colors ${
                    //   isActive ? '!bg-[#E3EDEC] !text-[#415B5A]' : 'hover:bg-sidebar-accent/50'
                    // }`}
                    className={`flex h-[3rem] w-full flex-row gap-2 p-3 transition-colors ${
                      isActive ? '!bg-[#E3EDEC]' : 'hover:bg-sidebar-accent/50 hover:text-white'
                    }`}
                  >
                    <NavLink to={item.url} className="flex items-center gap-2 w-full">
                      <div className="relative shrink-0">
                        <Icon className="h-4 w-4 text-current" />

                        {isNotifications && unreadCount > 0 && isCollapsed && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>

                      <span
                        className={`font-normal no-underline ${
                          isActive ? 'text-[#415B5A]' : 'text-[#E3EDEC]'
                        }`}
                      >
                        {item.title}
                      </span>

                      {isNotifications && unreadCount > 0 && !isCollapsed && (
                        <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
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
