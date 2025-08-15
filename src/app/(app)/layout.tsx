// app/(app)/layout.tsx
import { AppNavbar } from "@/components/custom/app-navbar";
import { AppSidebar } from "@/components/custom/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-screen flex-1 flex-col">
        <AppNavbar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
