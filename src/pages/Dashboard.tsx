import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { TrendingUp, TrendingDown, Users, FolderKanban, DollarSign, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const areaData = [
  { name: "Jan", valor: 4200 },
  { name: "Fev", valor: 5800 },
  { name: "Mar", valor: 4900 },
  { name: "Abr", valor: 7200 },
  { name: "Mai", valor: 6800 },
  { name: "Jun", valor: 8900 },
  { name: "Jul", valor: 9400 },
];

const barData = [
  { name: "Seg", tarefas: 12 },
  { name: "Ter", tarefas: 19 },
  { name: "Qua", tarefas: 8 },
  { name: "Qui", tarefas: 22 },
  { name: "Sex", tarefas: 16 },
  { name: "Sáb", tarefas: 5 },
  { name: "Dom", tarefas: 3 },
];

const metrics = [
  { label: "Receita mensal", value: "R$ 9.400", change: "+12.5%", up: true, icon: DollarSign },
  { label: "Projetos ativos", value: "24", change: "+3", up: true, icon: FolderKanban },
  { label: "Usuários", value: "1.284", change: "+8.2%", up: true, icon: Users },
  { label: "Uptime", value: "99.9%", change: "0%", up: true, icon: Activity },
];

const recentActivity = [
  { action: "Novo projeto criado", detail: "E-commerce App", time: "há 5 min" },
  { action: "Deploy realizado", detail: "Landing Page v2.1", time: "há 22 min" },
  { action: "Membro adicionado", detail: "Ana Silva — Equipe Design", time: "há 1h" },
  { action: "Fatura paga", detail: "Plano Profissional — R$ 99", time: "há 3h" },
  { action: "Projeto finalizado", detail: "Dashboard Analytics", time: "há 5h" },
];

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[hsl(260,50%,6%)]">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 flex items-center justify-between border-b border-purple-400/10 px-4 sm:px-6 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-purple-300/60 hover:text-white" />
              <h1 className="text-white font-semibold text-lg hidden sm:block">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-xs font-bold text-purple-300">
                U
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {/* Welcome */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Bem-vindo de volta 👋</h2>
              <p className="text-purple-300/50 text-sm mt-1">Aqui está um resumo da sua conta.</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {metrics.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-purple-400/10 bg-purple-950/50 backdrop-blur-sm p-5 hover:border-purple-400/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <m.icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className={`text-xs font-medium flex items-center gap-1 ${m.up ? "text-green-400" : "text-red-400"}`}>
                      {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {m.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">{m.value}</p>
                  <p className="text-xs text-purple-300/40 mt-1">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Revenue Chart */}
              <div className="rounded-xl border border-purple-400/10 bg-purple-950/50 backdrop-blur-sm p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Receita mensal</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(168,85,247,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(168,85,247,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(260,50%,12%)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 8, color: "#fff", fontSize: 13 }}
                    />
                    <Area type="monotone" dataKey="valor" stroke="#a855f7" fill="url(#purpleGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Tasks Chart */}
              <div className="rounded-xl border border-purple-400/10 bg-purple-950/50 backdrop-blur-sm p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Tarefas por dia</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(168,85,247,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(168,85,247,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(260,50%,12%)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 8, color: "#fff", fontSize: 13 }}
                    />
                    <Bar dataKey="tarefas" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-purple-400/10 bg-purple-950/50 backdrop-blur-sm p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Atividade recente</h3>
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-purple-400/5 last:border-0">
                    <div>
                      <p className="text-sm text-white">{a.action}</p>
                      <p className="text-xs text-purple-300/40">{a.detail}</p>
                    </div>
                    <span className="text-xs text-purple-300/30 shrink-0 ml-4">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
