import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader} from '@/components/ui/sidebar';
import React from 'react';

export const AdminSidebar: React.FC = () => {
  return(
    <Sidebar>
      <SidebarHeader>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup></SidebarGroup>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  )
};
