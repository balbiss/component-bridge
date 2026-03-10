import React, { useState, useEffect, useCallback } from "react";
import {
    Users, Search, Filter, MessageSquare, Bot, User,
    Pause, Play, Clock, ArrowRight, Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { API, getAuthHeader } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Atendimento = () => {
    const [instances, setInstances] = useState<any[]>([]);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const fetchInstances = useCallback(async () => {
        try {
            const headers = await getAuthHeader();
            const { data } = await axios.get(`${API}/instances`, { headers });
            if (Array.isArray(data)) {
                setInstances(data);
                if (data.length > 0 && !selectedInstanceId) {
                    setSelectedInstanceId(data[0].id);
                }
            }
        } catch (err) {
            console.error("Erro ao buscar instâncias:", err);
        }
    }, [selectedInstanceId]);

    const fetchLeads = useCallback(async (instanceId: string) => {
        if (!instanceId) return;
        setLoading(true);
        try {
            const headers = await getAuthHeader();
            const { data } = await axios.get(`${API}/leads/${instanceId}`, { headers });
            setLeads(data);
        } catch (err) {
            console.error("Erro ao buscar leads:", err);
            toast.error("Falha ao carregar leads.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    useEffect(() => {
        if (selectedInstanceId) {
            fetchLeads(selectedInstanceId);
        }
    }, [selectedInstanceId, fetchLeads]);

    const toggleAI = async (lead: any) => {
        try {
            const headers = await getAuthHeader();
            const newStatus = !lead.is_ai_active;
            await axios.post(`${API}/leads/${selectedInstanceId}/toggle-ai`, {
                remoteJid: lead.remote_jid,
                active: newStatus
            }, { headers });

            setLeads(prev => prev.map(l =>
                l.remote_jid === lead.remote_jid ? { ...l, is_ai_active: newStatus } : l
            ));

            toast.success(newStatus ? "IA Reativada" : "IA Pausada para este contato");
        } catch (err) {
            toast.error("Erro ao alterar status da IA");
        }
    };

    const filteredLeads = leads.filter(l =>
        l.remote_jid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.last_message && l.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Atendimento de Leads</h2>
                    <p className="text-gray-500">Monitore e intervenha nas conversas da IA em tempo real.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por número ou mensagem..."
                            className="pl-9 bg-white border-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => { setRefreshing(true); fetchLeads(selectedInstanceId); }}
                        disabled={refreshing || !selectedInstanceId}
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Instance Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {instances.map((inst) => (
                    <button
                        key={inst.id}
                        onClick={() => setSelectedInstanceId(inst.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${selectedInstanceId === inst.id
                                ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-200"
                                : "bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50"
                            }`}
                    >
                        <Bot className={`w-4 h-4 ${selectedInstanceId === inst.id ? "text-white" : "text-purple-500"}`} />
                        <span className="font-medium">{inst.name}</span>
                        {inst.status === 'connected' && (
                            <span className="w-2 h-2 rounded-full bg-green-400 border border-white" />
                        )}
                    </button>
                ))}
            </div>

            {/* Leads Grid/List */}
            <div className="grid grid-cols-1 gap-4">
                {loading && leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 italic text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-purple-600" />
                        Carregando leads...
                    </div>
                ) : filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                        <Card key={lead.remote_jid} className="group hover:border-purple-200 hover:shadow-md transition-all overflow-hidden border-gray-100">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row items-stretch md:items-center">
                                    {/* Contact Info */}
                                    <div className="p-4 flex items-center gap-4 flex-1">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${lead.is_ai_active ? "bg-purple-100" : "bg-orange-100"}`}>
                                            {lead.is_ai_active ? <Bot className="w-6 h-6 text-purple-600" /> : <User className="w-6 h-6 text-orange-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">+{lead.remote_jid}</span>
                                                {lead.is_ai_active ? (
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 gap-1">
                                                        <Bot className="w-3 h-3" /> IA Ativa
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100 gap-1">
                                                        Pausada para Humano
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate mt-1">
                                                <span className={`font-medium ${lead.last_role === 'assistant' ? "text-purple-600" : "text-blue-600"}`}>
                                                    {lead.last_role === 'assistant' ? "🤖 IA: " : "👤 Cliente: "}
                                                </span>
                                                {lead.last_message || "Sem histórico recente"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions & Time */}
                                    <div className="bg-gray-50/50 md:bg-transparent border-t md:border-t-0 md:border-l border-gray-100 p-4 flex items-center justify-between md:justify-end gap-6 md:w-80 shrink-0">
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium whitespace-nowrap">
                                                <Clock className="w-3 h-3" />
                                                {lead.last_time ? formatDistanceToNow(new Date(lead.last_time), { addSuffix: true, locale: ptBR }) : '-'}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={lead.is_ai_active ? "outline" : "default"}
                                                size="sm"
                                                onClick={() => toggleAI(lead)}
                                                className={!lead.is_ai_active ? "bg-purple-600 hover:bg-purple-700" : "border-purple-200 text-purple-600 hover:bg-purple-50"}
                                            >
                                                {lead.is_ai_active ? (
                                                    <><Pause className="w-4 h-4 mr-2" /> Pausar IA</>
                                                ) : (
                                                    <><Play className="w-4 h-4 mr-2" /> Retomar IA</>
                                                )}
                                            </Button>

                                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-600">
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed text-gray-400">
                        <Users className="w-12 h-12 mb-4 text-gray-200" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhum lead encontrado</h3>
                        <p className="max-w-xs text-center mt-2">
                            Assim que sua IA começar a conversar com novos contatos, eles aparecerão aqui.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Atendimento;
