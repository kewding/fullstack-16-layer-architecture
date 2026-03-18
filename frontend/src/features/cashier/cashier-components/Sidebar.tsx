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
import { NavLink, useLocation } from 'react-router-dom';
import { CashierSidebarSections } from '../cashier-constants/sidebar-sections';
import { loginService } from '@/features/auth/login/services/login.service';
import { LogOut } from 'lucide-react';

export function CashierSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { logout } = useAuth();
  // const navigate = useNavigate();

  const handleLogout = async () => {
    await loginService.logout();
    logout();
    window.location.replace('/login');
  };

  return (
    <Sidebar collapsible="icon" {...props} className="pr-0">
      <SidebarContent className="py-20">
        <SidebarGroup>
          {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
          <SidebarMenu className="flex flex-col gap-1">
            {/* sidebar sections */}
            {CashierSidebarSections.navMain.map((item) => {
              // since icons are not saved as jsx
              const Icon = item.icon;
              // checks whether url of active path
              const isActive = location.pathname === item.url;

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={`flex flex-row w-full h-[3rem] justify-stretch gap-2 p-3 transition-colors ${
                      isActive ? '!bg-black !text-white' : 'hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <NavLink to={item.url}>
                      <Icon />
                      <span className="font-normal">{item.title}</span>
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
