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
      <div className="min-h-screen flex w-full bg-gray-50">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-gray-500 hover:text-gray-800" />
              <h1 className="text-gray-900 font-semibold text-lg hidden sm:block">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-400/30 flex items-center justify-center text-xs font-bold text-purple-600">
                U
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {/* Welcome */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Bem-vindo de volta 👋</h2>
              <p className="text-gray-500 text-sm mt-1">Aqui está um resumo da sua conta.</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {metrics.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                      <m.icon className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className={`text-xs font-medium flex items-center gap-1 ${m.up ? "text-green-600" : "text-red-500"}`}>
                      {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {m.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Revenue Chart */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Receita mensal</h3>
                <ResponsiveContainer width="100%" height={220}>
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
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, color: "#111", fontSize: 13 }}
                    />
                    <Area type="monotone" dataKey="valor" stroke="#a855f7" fill="url(#purpleGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Tasks Chart */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Tarefas por dia</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, color: "#111", fontSize: 13 }}
                    />
                    <Bar dataKey="tarefas" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Atividade recente</h3>
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm text-gray-800">{a.action}</p>
                      <p className="text-xs text-gray-400">{a.detail}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-4">{a.time}</span>
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
