// components/app-sidebar.tsx
"use client";

import * as React from "react";
import { NavMain } from "@/components/custom/nav-main";
import { NavUser } from "@/components/custom/nav-user";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { menuItem } from "@/utils/menu";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Header brand */}
      <SidebarHeader className="px-2 py-3">
        <div className="flex items-center gap-2 px-2">
          <div className="size-4 rounded-lg bg-primary/90" />
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-4 md:pt-6">
        <NavMain items={menuItem.navMain} />
      </SidebarContent>

      <SidebarFooter className="pt-2">
        <NavUser user={menuItem.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
