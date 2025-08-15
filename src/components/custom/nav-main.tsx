"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type Item = {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: { title: string; url: string }[];
};

// Helper untuk normalisasi path
function normalizePath(p: string) {
  let path = p.split("?")[0].split("#")[0];
  if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}
const isActiveExact = (pathname: string, href: string) =>
  normalizePath(pathname) === normalizePath(href);

export function NavMain({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu className="gap-2 md:gap-2.5">
        {items.map((item) => {
          const hasChildren = (item.items?.length ?? 0) > 0;
          const Icon = item.icon;

          if (!hasChildren) {
            const active = isActiveExact(pathname, item.url);
            return (
              <SidebarMenuItem key={item.title} className="my-0.5">
                <SidebarMenuButton
                  asChild
                  data-active={active ? "true" : undefined}
                  className={cn(
                    "text-[0.975rem] md:text-base py-2.5",
                    "transition-colors hover:bg-primary/10 hover:text-primary",
                    "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium",
                    "relative data-[active=true]:before:absolute data-[active=true]:before:inset-y-1 data-[active=true]:before:left-0 data-[active=true]:before:w-1 data-[active=true]:before:rounded-r data-[active=true]:before:bg-primary"
                  )}
                >
                  <Link href={item.url}>
                    {Icon && <Icon className="shrink-0" />}
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          const hasActiveChild =
            item.items?.some((sub) => isActiveExact(pathname, sub.url)) ?? false;

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={hasActiveChild}
              className="group/collapsible"
            >
              <SidebarMenuItem className="my-0.5">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className={cn(
                      "text-[0.975rem] md:text-base py-2.5",
                      "transition-colors hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    {Icon && <Icon className="shrink-0" />}
                    <span className="truncate">{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub className="mt-1">
                    {item.items?.map((sub) => {
                      const subActive = isActiveExact(pathname, sub.url);
                      return (
                        <SidebarMenuSubItem key={sub.title} className="my-0.5">
                          <SidebarMenuSubButton
                            asChild
                            data-active={subActive ? "true" : undefined}
                            className={cn(
                              "text-[0.95rem] py-2",
                              "transition-colors hover:bg-primary/10 hover:text-primary",
                              "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium"
                            )}
                          >
                            <Link href={sub.url}>
                              <span className="truncate">{sub.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
