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
import { AdminSidebarSections } from '../admin-constants/sidebar-sections';


export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const location = useLocation();

  return (
    <Sidebar collapsible="icon" {...props} className="pr-0 pl-0">
      <SidebarContent className="py-20">
        <SidebarGroup>
          {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
          <SidebarMenu className="flex flex-col gap-1">
            {/* sidebar sections */}
            {AdminSidebarSections.navMain.map((item) => {
              // since icons are not saved as jsx
              const Icon = item.icon;
              // checks whether url of active path
              const isActive = location.pathname === item.url;

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={`flex flex-row w-full h-[3.15rem] gap-2 transition-colors ${
                      isActive
                        ? '!bg-black !text-white' 
                        : 'hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center w-full h-full gap-2 px-3 transition-colors ${
                          isActive
                            ? 'bg-red-800 text-sidebar-accent-foreground shadow-sm'
                            : 'hover:bg-sidebar-accent/50'
                        }`
                      }
                    >
                      <Icon className="!size-4" />
                      <span className="font-normal">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{/* User profile or Logout button goes here */}</SidebarFooter>
    </Sidebar>
  );
}
