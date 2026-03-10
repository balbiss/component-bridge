import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Bell,
  LogOut,
  ShoppingCart,
  DollarSign,
  Activity,
  Bot,
  MessageSquare,
  Zap,
  Link2,
  Menu,
  X,
  TrendingUp,
  Search,
  ChevronDown,
  Book
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeader, API } from "@/lib/api";
import axios from "axios";
import Canais from "@/components/Canais";
import CampaignHistory from "@/components/CampaignHistory";
import MassDispatch from "@/components/MassDispatch";
import KnowledgeBase from "./KnowledgeBase";
import Atendimento from "@/components/Atendimento";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

const areaData = [
  { name: "Jan", mensagens: 2100 },
  { name: "Fev", mensagens: 3400 },
  { name: "Mar", mensagens: 4200 },
  { name: "Abr", mensagens: 2800 },
  { name: "Mai", mensagens: 5600 },
  { name: "Jun", mensagens: 7200 },
  { name: "Jul", mensagens: 8100 },
];

const barData = [
  { name: "Seg", interacoes: 12 },
  { name: "Ter", interacoes: 19 },
  { name: "Qua", interacoes: 15 },
  { name: "Qui", interacoes: 22 },
  { name: "Sex", interacoes: 18 },
  { name: "Sáb", interacoes: 8 },
  { name: "Dom", interacoes: 5 },
];

// Stats will be managed inside the component state now.

const recentOrders = [
  { id: "1", customer: "Ana Silva", email: "ana@email.com", amount: "R$ 1.999", status: "Concluído" },
  { id: "2", customer: "Carlos Mendes", email: "carlos@email.com", amount: "R$ 399", status: "Processando" },
  { id: "3", customer: "Marina Costa", email: "marina@email.com", amount: "R$ 2.990", status: "Concluído" },
  { id: "4", customer: "Rafael Torres", email: "rafael@email.com", amount: "R$ 990", status: "Pendente" },
  { id: "5", customer: "Juliana Oliveira", email: "juliana@email.com", amount: "R$ 399", status: "Concluído" },
];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState({
    totalMessages: 0,
    aiInteractions: 0,
    activeConnections: 0,
    pendingFollowUps: 0,
    totalDocs: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async () => {
    try {
      const headers = await getAuthHeader();
      const res = await axios.get(`${API}/stats`, { headers });
      setDashboardStats(res.data);
    } catch (err) {
      console.error("Erro ao buscar stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchStats();
    // Refresh every 30 seconds
    const statsTimer = setInterval(fetchStats, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(statsTimer);
    };
  }, []);

  const statsList = [
    { title: "Total de Mensagens", value: dashboardStats.totalMessages.toLocaleString('pt-BR'), change: "Total de interações", icon: <MessageSquare className="w-4 h-4" />, trend: "up" as const, color: "bg-blue-100 text-blue-600" },
    { title: "IA Ativa (Respostas)", value: dashboardStats.aiInteractions.toLocaleString('pt-BR'), change: "Respostas automáticas", icon: <Zap className="w-4 h-4" />, trend: "up" as const, color: "bg-yellow-100 text-yellow-600" },
    { title: "Follow-ups Ativos", value: dashboardStats.pendingFollowUps.toString(), change: "Agendados para sair", icon: <Bell className="w-4 h-4" />, trend: "up" as const, color: "bg-purple-100 text-purple-600" },
    { title: "Sessões Ativas", value: dashboardStats.activeConnections.toString(), change: "Canais operando", icon: <Activity className="w-4 h-4" />, trend: "up" as const, color: "bg-green-100 text-green-600" },
  ];

  const navItems: NavItem[] = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard", href: "dashboard" },
    { icon: <MessageSquare className="w-4 h-4" />, label: "Atendimento", href: "atendimento", badge: 12 },
    { icon: <Bot className="w-4 h-4" />, label: "Agentes/IA", href: "agentes" },
    { icon: <Book className="w-4 h-4" />, label: "Conhecimento (PDF)", href: "knowledge" },
    { icon: <Users className="w-4 h-4" />, label: "Contatos / CRM", href: "contatos" },
    { icon: <BarChart3 className="w-4 h-4" />, label: "Relatórios", href: "relatorios" },
    { icon: <Link2 className="w-4 h-4" />, label: "Canais / Conexões", href: "conexoes" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-16 w-64"
          } fixed md:relative z-30 h-full bg-[hsl(260,60%,8%)] flex flex-col transition-all duration-300 shrink-0 overflow-hidden`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-purple-600/30 border border-purple-400/30 flex items-center justify-center font-bold text-sm text-white shrink-0">
            IW
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-white text-base whitespace-nowrap">InoovaWeb</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => setActiveItem(item.href)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${activeItem === item.href
                ? "bg-purple-600 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
              </div>
              {item.badge && sidebarOpen && (
                <Badge className="bg-purple-400/20 text-purple-300 border-purple-400/30 text-xs text-[10px] font-bold">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 space-y-1 border-t border-white/5">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-800 p-1">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-gray-900 font-semibold text-lg hidden sm:block">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="text-xs text-gray-400">Seu plano</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              Pro
            </span>
            <span className="hidden sm:inline">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase()).replace(/de (\w)/, (m, c) => 'de ' + c.toUpperCase())}
              {' · '}
            </span>
            <span className="font-medium text-gray-700">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
          {activeItem === "dashboard" ? (
            <>
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Bem-vindo de volta! Aqui está o resumo do seu negócio hoje.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statsList.map((stat, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div>
                      {loadingStats ? (
                        <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-md" />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      )}
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1 flex items-center gap-1 font-medium">
                        {stat.change}
                      </p>
                    </div>
                    {/* Subtle bottom line indicator */}
                    <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 w-0 group-hover:w-full ${stat.color.split(' ')[1].replace('text-', 'bg-')}`} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    Mensagens Enviadas
                  </h3>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={areaData}>
                        <defs>
                          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="mensagens" stroke="#a855f7" fill="url(#purpleGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    Interações de IA por Dia
                  </h3>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="interacoes" fill="#a855f7" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <h3 className="text-base font-bold text-gray-900"> Campanhas & Disparos</h3>
                  </div>
                </div>
                <div>
                  <CampaignHistory />
                </div>
              </div>
            </>
          ) : activeItem === "automacao" ? (
            <MassDispatch onClose={() => setActiveItem("dashboard")} instance={null} />
          ) : activeItem === "conexoes" ? (
            <Canais />
          ) : activeItem === "atendimento" ? (
            <Atendimento />
          ) : activeItem === "knowledge" ? (
            <KnowledgeBase />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Bot className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Página em Construção</h3>
                <p className="text-gray-500 max-w-sm">Estamos trabalhando na implementação desta funcionalidade. Em breve você poderá gerenciar seus {activeItem} aqui.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
