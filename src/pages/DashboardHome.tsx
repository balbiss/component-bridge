import React from 'react';
import {
    TrendingUp,
    DollarSign,
    Users,
    ShoppingCart,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import DashboardLayout from '@/components/DashboardLayout';
import CampaignHistory from '@/components/CampaignHistory';

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

const stats = [
    { title: "Receita total", value: "R$ 45.231", change: "+20.1%", trend: "up", icon: <DollarSign className="w-4 h-4" /> },
    { title: "Usuários ativos", value: "+2.350", change: "+180.1%", trend: "up", icon: <Users className="w-4 h-4" /> },
    { title: "Vendas", value: "+12.234", change: "+19%", trend: "up", icon: <ShoppingCart className="w-4 h-4" /> },
    { title: "Ativos agora", value: "+573", change: "+201", trend: "up", icon: <Activity className="w-4 h-4" /> },
];

const recentOrders = [
    { id: "1", customer: "Ana Silva", email: "ana@email.com", amount: "R$ 1.999", status: "Concluído" },
    { id: "2", customer: "Carlos Mendes", email: "carlos@email.com", amount: "R$ 399", status: "Processando" },
    { id: "3", customer: "Marina Costa", email: "marina@email.com", amount: "R$ 2.990", status: "Concluído" },
    { id: "4", customer: "Rafael Torres", email: "rafael@email.com", amount: "R$ 990", status: "Pendente" },
    { id: "5", customer: "Juliana Oliveira", email: "juliana@email.com", amount: "R$ 399", status: "Concluído" },
];

const DashboardHome = () => {
    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Bem-vindo de volta!</h2>
                    <p className="text-sm text-gray-500 mt-1">Aqui está o que está acontecendo com seu negócio hoje.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    {stat.icon}
                                </div>
                                <Badge variant="secondary" className={stat.trend === 'up' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}>
                                    {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {stat.change}
                                </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                            <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-base font-bold text-gray-900 mb-4">Receita Mensal</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={areaData}>
                                    <defs>
                                        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ stroke: '#8b5cf6', strokeWidth: 2 }}
                                    />
                                    <Area type="monotone" dataKey="valor" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-base font-bold text-gray-900 mb-4">Tarefas Completadas</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f5f3ff' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="tarefas" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Campaign History / Recent Activity */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-600" />
                            <h3 className="text-base font-bold text-gray-900"> Campanhas & Disparos</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-purple-600 font-semibold h-8 text-xs">Atualizar</Button>
                    </div>
                    <div>
                        <CampaignHistory />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DashboardHome;
