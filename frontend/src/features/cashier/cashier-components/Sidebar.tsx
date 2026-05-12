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
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CashierSidebarSections } from '../cashier-constants/sidebar-sections';

// ── withdrawal pending-count hook ─────────────────────────────────────────────
// We call the REST endpoint directly here to avoid a circular import.
// The WebSocket pushes { pending_count: number } every 10 s from the backend.

function useWithdrawPendingCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Initial REST fetch
    fetch('/api/cashier/withdraw/pending-count')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && typeof json.data?.count === 'number') {
          setCount(json.data.count);
        }
      })
      .catch(() => {});

    // WebSocket for live updates (pushed by backend every 10 s)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/api/cashier/withdraw/ws`,
    );

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (typeof data.pending_count === 'number') {
          setCount(data.pending_count);
        }
      } catch { /* ignore malformed frames */ }
    };

    ws.onerror = () => ws.close();

    return () => ws.close();
  }, []);

  return count;
}

// ── sidebar component ─────────────────────────────────────────────────────────

export function CashierSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location   = useLocation();
  const { logout } = useAuth();
  const { state }  = useSidebar();
  const withdrawPendingCount = useWithdrawPendingCount();

  const isCollapsed = state === 'collapsed';

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
            {CashierSidebarSections.navMain.map((item) => {
              const Icon           = item.icon;
              const isActive       = location.pathname === item.url;
              const isWithdrawItem = item.url === '/cashier/withdraw';
              const showBadge      = isWithdrawItem && withdrawPendingCount > 0;

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={`flex h-[3rem] w-full flex-row gap-2 p-3 transition-colors ${
                      isActive ? '!bg-black !text-white' : 'hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <NavLink to={item.url} className="flex items-center gap-2 w-full">
                      {/* Icon — with collapsed-state badge dot */}
                      <div className="relative shrink-0">
                        <Icon className="h-4 w-4 text-current" />
                        {showBadge && isCollapsed && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
                            {withdrawPendingCount > 99 ? '99+' : withdrawPendingCount}
                          </span>
                        )}
                      </div>

                      <span className="font-normal">{item.title}</span>

                      {/* Expanded-state inline pill */}
                      {showBadge && !isCollapsed && (
                        <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                          {withdrawPendingCount > 99 ? '99+' : withdrawPendingCount}
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