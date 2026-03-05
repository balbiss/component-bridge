import React from "react";
import {
  LayoutDashboard,
  Bot,
  BarChart3,
  Users,
  LogOut,
  Link2,
  MessageSquare,
  Zap,
  Book
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSidebar } from "@/components/ui/sidebar";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

const mainItems: NavItem[] = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard", href: "/dashboard" },
  { icon: <MessageSquare className="w-4 h-4" />, label: "Atendimentos", href: "/dashboard/atendimentos", badge: 12 },
  { icon: <Bot className="w-4 h-4" />, label: "Agentes/IA", href: "/dashboard/agentes" },
  { icon: <Users className="w-4 h-4" />, label: "Contatos / CRM", href: "/dashboard/contatos" },
  { icon: <Book className="w-4 h-4" />, label: "Base de Conhecimento (PDF)", href: "/dashboard/knowledge" },
  { icon: <BarChart3 className="w-4 h-4" />, label: "Relatórios", href: "/dashboard/relatorios" },
  { icon: <Link2 className="w-4 h-4" />, label: "Canais / Conexões", href: "/dashboard/conexoes" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const open = state === "expanded";

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside
      className={`${open ? "w-60" : "w-16"
        } bg-[hsl(260,60%,8%)] flex flex-col transition-all duration-300 shrink-0 overflow-hidden border-r border-white/5 h-screen sticky top-0`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 gap-3 shrink-0 border-b border-white/5">
        <div className="w-9 h-9 rounded-lg bg-purple-600/30 border border-purple-400/30 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg shadow-purple-900/20">
          IW
        </div>
        {open && (
          <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
            InoovaWeb
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainItems.map((item) => (
          <button
            key={item.href}
            onClick={() => navigate(item.href)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive(item.href)
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30 ring-1 ring-white/10"
              : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
          >
            <div className="flex items-center gap-3">
              <span className={`${isActive(item.href) ? "text-white" : "text-purple-400 group-hover:text-purple-300"} transition-colors shrink-0`}>
                {item.icon}
              </span>
              {open && (
                <span className="text-sm font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-1">
                  {item.label}
                </span>
              )}
            </div>
            {item.badge && open && (
              <Badge className="bg-purple-500/20 text-purple-200 border-none h-5 px-1.5 min-w-[20px] justify-center text-[10px] font-bold">
                {item.badge}
              </Badge>
            )}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:rotate-12 transition-transform" />
          {open && <span className="font-medium">Sair da conta</span>}
        </button>
      </div>
    </aside>
  );
}
