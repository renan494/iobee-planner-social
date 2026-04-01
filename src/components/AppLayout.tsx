import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b bg-card/80 backdrop-blur-md px-4 sticky top-0 z-30">
            <SidebarTrigger className="mr-3" />
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
          <footer className="border-t bg-card/60 px-6 py-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>iOBEE © {new Date().getFullYear()}</span>
            <span>© {new Date().getFullYear()} iOBEE – Agência de Marketing Digital e Growth. Todos os direitos reservados.</span>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}