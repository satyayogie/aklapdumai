// components/app-breadcrumb.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { menuItem } from "@/utils/menu";

// ====== TYPES: HILANGKAN `any` ======
type NavItem = {
  title: string;
  url: string;
  items?: NavItem[];
};

// Sembunyikan segmen tertentu (route groups)
const HIDDEN_SEGMENTS = new Set(["(dashboard)", "(marketing)", "(app)"]);

// Heuristik untuk ID (angka/uuid) → label "Detail"
const looksLikeId = (s: string) =>
  /^[0-9]+$/.test(s) || /^[0-9a-f-]{8,}$/i.test(s);

// Titleize slug
const titleize = (slug: string) =>
  slug.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

// ====== TANPA `any` ======
function buildPathLabelMap(nav: NavItem[]): Map<string, string> {
  const map = new Map<string, string>();

  const walk = (items: NavItem[]): void => {
    for (const it of items) {
      const url = (it.url ?? "").trim();
      // skip placeholder "#"
      if (url && url !== "#" && url.startsWith("/")) {
        const key = url.replace(/\/+$/, "") || "/";
        map.set(key, it.title);
      }
      if (it.items && it.items.length > 0) {
        walk(it.items);
      }
    }
  };

  walk(nav);
  return map;
}

function normalize(path: string): string {
  let p = path.split("?")[0].split("#")[0];
  if (p !== "/" && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

export function AppBreadcrumbs() {
  const pathname = usePathname();

  const pathLabelMap = React.useMemo(
    () => buildPathLabelMap(menuItem.navMain as NavItem[]),
    []
  );

  const segmentsAll = React.useMemo(
    () => pathname.split("/").filter(Boolean),
    [pathname]
  );
  const segmentsFiltered = segmentsAll.filter((s) => !HIDDEN_SEGMENTS.has(s));

  const rootIsDashboard = normalize(pathname).startsWith("/dashboard");

  // ❗ Skip segmen pertama "dashboard" kalau rootIsDashboard
  const segments = rootIsDashboard && segmentsFiltered[0] === "dashboard"
    ? segmentsFiltered.slice(1)
    : segmentsFiltered;

  const items = segments.map((_, i) => {
    const href = "/" + segmentsFiltered.slice(0, i + 1 + (rootIsDashboard ? 1 : 0)).join("/");
    const nHref = normalize(href);
    const lastSeg = segments[i];

    const labelFromMenu = pathLabelMap.get(nHref);
    const label =
      labelFromMenu ?? (looksLikeId(lastSeg) ? "Detail" : titleize(lastSeg));

    return { href: nHref, label, isLast: i === segments.length - 1 };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Root */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={rootIsDashboard ? "/dashboard" : "/"}>
              {rootIsDashboard ? "Dashboard" : "Home"}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.length > 0 && <BreadcrumbSeparator />}

        {items.map((it, idx) => (
          <React.Fragment key={it.href}>
            {!it.isLast ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={it.href}>{it.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {idx < items.length - 1 && <BreadcrumbSeparator />}
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>{it.label}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
