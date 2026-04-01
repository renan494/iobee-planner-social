import {
  LayoutDashboard,
  PenTool,
  CalendarDays,
  Users,
  UserCog,
  Shield,
  LogOut,
  FileEdit,
  UserCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import logo from "@/assets/logo-iobee.svg";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const isAdmin = useAdminCheck();

  const items = [
    { title: "Meus Dados", url: "/meus-dados", icon: UserCircle },
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Produzir Conteúdo", url: "/criar", icon: PenTool },
    { title: "Rascunhos", url: "/rascunhos", icon: FileEdit },
    { title: "Calendário", url: "/calendario", icon: CalendarDays },
    { title: "Clientes", url: "/clientes", icon: Users },
    { title: "Analistas", url: "/analistas", icon: UserCog },
    ...(isAdmin ? [{ title: "Gerenciar Acessos", url: "/admin", icon: Shield }] : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 px-4 py-5 cursor-pointer">
          <img src={logo} alt="iOBEE" className="h-7 shrink-0" />
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground/70">
              Social Lab
            </span>
          )}
        </button>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto px-3 pb-4">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}