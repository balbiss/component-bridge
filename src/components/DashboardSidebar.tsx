import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Users,
  Settings,
  Bell,
  LogOut,
  CreditCard,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projetos", url: "/dashboard/projetos", icon: FolderKanban },
  { title: "Análises", url: "/dashboard/analises", icon: BarChart3 },
  { title: "Equipe", url: "/dashboard/equipe", icon: Users },
  { title: "Faturamento", url: "/dashboard/faturamento", icon: CreditCard },
];

const settingsItems = [
  { title: "Notificações", url: "/dashboard/notificacoes", icon: Bell },
  { title: "Configurações", url: "/dashboard/configuracoes", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-[hsl(260,60%,8%)]">
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-600/30 border border-purple-400/30 flex items-center justify-center font-bold text-sm text-purple-300 shrink-0">
          IW
        </div>
        {!collapsed && (
          <span className="font-semibold text-white text-base">InoovaWeb</span>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-300/50 text-xs uppercase tracking-wider">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="text-purple-200/60 hover:text-white hover:bg-purple-800/40 transition-colors rounded-lg"
                      activeClassName="bg-purple-800/50 text-white font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-300/50 text-xs uppercase tracking-wider">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="text-purple-200/60 hover:text-white hover:bg-purple-800/40 transition-colors rounded-lg"
                      activeClassName="bg-purple-800/50 text-white font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/login"
                className="text-purple-300/50 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-lg"
              >
                <LogOut className="mr-2 h-4 w-4 shrink-0" />
                {!collapsed && <span>Sair</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
