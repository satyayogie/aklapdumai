// components/app-navbar.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppBreadcrumbs } from "./app-breadcrumbs";
import { ModeToggle } from "./toggle-mode";

type AppNavbarProps = React.ComponentPropsWithoutRef<"header">;

export function AppNavbar({ className, ...props }: AppNavbarProps) {
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center transition-[width,height] ease-linear",
        "group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
        className
      )}
      {...props}
    >
      <div className="flex w-full items-center gap-3 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />

        {/* Breadcrumb di kiri */}
        <AppBreadcrumbs />

        {/* Spacer agar toggle nempel kanan dan tidak mepet breadcrumb */}
        <div className="ml-auto" />

        {/* Toggle mode di paling kanan */}
        <ModeToggle />
      </div>
    </header>
  );
}
