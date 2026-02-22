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
import { UserSidebarSections } from '../user-constants/sidebar-sections';

export function UserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();

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
      <SidebarFooter>{/* User profile or Logout button goes here */}</SidebarFooter>
    </Sidebar>
  );
}
