import React, { useState, useEffect } from "react";
import {
    BarChart3, TrendingUp, Zap, MessageSquare,
    Users, Bot, ArrowUpRight, Activity, Calendar
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { API, getAuthHeader } from "@/lib/api";

const Relatorios = () => {
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const headers = await getAuthHeader();
                const { data } = await axios.get(`${API}/reports`, { headers });
                setReportData(data);
            } catch (err) {
                console.error("Erro ao carregar relatórios:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-purple-600 space-y-4">
                <Activity className="w-12 h-12 animate-pulse" />
                <p className="text-gray-500 font-medium">Gerando relatórios consolidados...</p>
            </div>
        );
    }

    const COLORS = ['#a855f7', '#6366f1', '#3b82f6', '#10b981'];

    const pieData = [
        { name: 'IA (Autômato)', value: reportData.iaVsHuman.ia },
        { name: 'Humano', value: reportData.iaVsHuman.human },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Relatórios de Performance</h2>
                <p className="text-gray-500">Analise a eficiência da sua IA e o volume de mensagens por período.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-gray-100 shadow-sm overflow-hidden group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                                <MessageSquare className="w-5 h-5 text-purple-600" />
                            </div>
                            <Badge variant="outline" className="border-green-100 bg-green-50 text-green-600">Direto do Banco</Badge>
                        </div>
                        <h3 className="text-sm font-medium text-gray-400">Total de Mensagens (7d)</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-bold text-gray-900">
                                {(reportData.iaVsHuman.ia + reportData.iaVsHuman.human).toLocaleString('pt-BR')}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm overflow-hidden group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-yellow-50 rounded-lg group-hover:bg-yellow-100 transition-colors">
                                <Zap className="w-5 h-5 text-yellow-600" />
                            </div>
                            <Badge variant="outline" className="border-purple-100 bg-purple-50 text-purple-600">Taxa IA</Badge>
                        </div>
                        <h3 className="text-sm font-medium text-gray-400">Automação Assistida</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-bold text-gray-900">
                                {Math.round((reportData.iaVsHuman.ia / (reportData.iaVsHuman.ia + reportData.iaVsHuman.human || 1)) * 100)}%
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm overflow-hidden group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <Activity className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-400">Atividade Global</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-bold text-gray-900">Estável</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Main Volume Chart */}
                <Card className="border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                Mensagens nos últimos 7 dias
                            </h3>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={reportData.dailyMessages}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* IA vs Human Pie Chart */}
                <Card className="border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                        <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Bot className="w-4 h-4 text-purple-600" />
                            Eficiência: IA vs Intervenção Humana
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Instances Bar Chart */}
            <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        Top 5 Agentes (Mais Ativos)
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.topInstances} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="messages" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Relatorios;
