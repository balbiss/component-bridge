import React, { useState, useEffect, useCallback } from "react";
import {
    Link2, RefreshCw, Smartphone, XCircle, Plus, Loader2, QrCode,
    Trash2, MessageCircle, Activity, Settings, Send, Bot, Users, Target, ClipboardList, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { MassDispatch } from "./MassDispatch";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import KnowledgeBase from "../pages/KnowledgeBase";
import { API, getAuthHeader } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";



// ────────────────────────────────────────────────────────────────
const Canais = () => {
    const [instances, setInstances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState(Date.now());
    const [secondsAgo, setSecondsAgo] = useState(0);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState("");
    const [qrLoading, setQrLoading] = useState(false);
    const [showPairingInput, setShowPairingInput] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [pairingCode, setPairingCode] = useState("");
    const [massDispatchInstance, setMassDispatchInstance] = useState<any | null>(null);
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [editingAIInstance, setEditingAIInstance] = useState<any | null>(null);
    const [tempPrompt, setTempPrompt] = useState("");
    const [tempDelayMin, setTempDelayMin] = useState(2000);
    const [tempDelayMax, setTempDelayMax] = useState(5000);
    const [savingAI, setSavingAI] = useState(false);
    const [activeAITab, setActiveAITab] = useState("behavior");

    // --- HUMAN HANDOVER & RODIZIO STATES ---
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [editingHandoverInstance, setEditingHandoverInstance] = useState<any | null>(null);
    const [handoverTriggers, setHandoverTriggers] = useState("");
    const [adminNotificationPhone, setAdminNotificationPhone] = useState("");
    const [attendants, setAttendants] = useState<any[]>([]);
    const [newAttName, setNewAttName] = useState("");
    const [newAttPhone, setNewAttPhone] = useState("");
    const [loadingHandover, setLoadingHandover] = useState(false);
    const [savingHandover, setSavingHandover] = useState(false);
    const [roundRobinActive, setRoundRobinActive] = useState(true);

    // --- Leads em Atendimento ---
    const [showLeadsModal, setShowLeadsModal] = useState(false);
    const [handoverLeads, setHandoverLeads] = useState<any[]>([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [editingLeadsInstance, setEditingLeadsInstance] = useState<any | null>(null);
    const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
    const [editingKnowledgeInstance, setEditingKnowledgeInstance] = useState<any | null>(null);

    // ── Buscar instâncias ──────────────────────────────────────
    const fetchInstances = useCallback(async () => {
        try {
            const headers = await getAuthHeader();
            const { data } = await axios.get(`${API}/instances`, { headers });
            if (Array.isArray(data)) setInstances(data);
            setLastSync(Date.now());
        } catch (err: any) {
            console.warn("[Canais] Erro ao sincronizar:", err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Carga inicial
    useEffect(() => { fetchInstances(); }, [fetchInstances]);

    // Polling a cada 5s (menos spam no console)
    useEffect(() => {
        const interval = setInterval(fetchInstances, 5000);
        return () => clearInterval(interval);
    }, [fetchInstances]);

    // Contador de "há X segundos"
    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsAgo(Math.floor((Date.now() - lastSync) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [lastSync]);

    // Fechar modal quando instância conectar
    useEffect(() => {
        if (!selectedInstance) return;
        const inst = instances.find((i: any) => i.id === selectedInstance);
        if (inst?.status === "connected") {
            setQrCode("");
            setPairingCode("");
            setShowPairingInput(false);
            setSelectedInstance(null);
            toast.success(`WhatsApp "${inst.name}" conectado com sucesso! ✅`);
        }
    }, [instances, selectedInstance]);

    // ── Criar instância ────────────────────────────────────────
    const createInstance = async () => {
        if (!newName.trim()) return toast.error("Digite um nome para a conexão");
        setCreating(true);
        try {
            const headers = await getAuthHeader();
            await axios.post(`${API}/instances`, { name: newName.trim() }, { headers });
            setNewName("");
            await fetchInstances();
            toast.success("Conexão criada com sucesso! 🎉");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Erro ao criar conexão");
        } finally {
            setCreating(false);
        }
    };

    // ── QR Code ────────────────────────────────────────────────
    const fetchQRCode = async (instanceId: string) => {
        setSelectedInstance(instanceId);
        setQrLoading(true);
        setQrCode("");
        try {
            const headers = await getAuthHeader();
            const { data } = await axios.get(`${API}/instances/${instanceId}/qr`, { headers });
            if (data?.data?.QRCode) {
                setQrCode(data.data.QRCode);
            } else if (data?.connected) {
                toast.info("WhatsApp já está conectado.");
                setSelectedInstance(null);
            } else {
                toast.warning("Nenhum QR Code disponível. Tente novamente.");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Erro ao buscar QR Code");
        } finally {
            setQrLoading(false);
        }
    };

    // ── Código de Pareamento ───────────────────────────────────
    const fetchPairingCode = async () => {
        if (!phoneNumber.trim()) return toast.error("Digite o número com DDI+DDD");
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
        setQrLoading(true);
        try {
            const headers = await getAuthHeader();
            const { data } = await axios.post(
                `${API}/instances/${selectedInstance}/pair`,
                { phone: cleanPhone },
                { headers }
            );
            const code = data?.data?.LinkingCode || data?.linkingCode;
            if (code) {
                setPairingCode(code);
                setShowPairingInput(false);
            } else {
                toast.warning("Código não retornado. Verifique o número e tente novamente.");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Erro ao gerar código de pareamento");
        } finally {
            setQrLoading(false);
        }
    };

    // ── Logout ─────────────────────────────────────────────────
    const logoutInstance = async (instanceId: string) => {
        try {
            const headers = await getAuthHeader();
            await axios.post(`${API}/instances/${instanceId}/logout`, {}, { headers });
            toast.success("Sessão encerrada");
            fetchInstances();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Erro ao desconectar");
        }
    };

    // ── Deletar ────────────────────────────────────────────────
    const deleteInstance = async (instanceId: string) => {
        if (!window.confirm("Tem certeza que deseja deletar permanentemente esta conexão?")) return;
        try {
            const headers = await getAuthHeader();
            await axios.delete(`${API}/instances/${instanceId}`, { headers });
            toast.success("Conexão removida!");
            setInstances(prev => prev.filter(i => i.id !== instanceId));
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Falha ao deletar");
        }
    };

    // ── Salvar Config IA ──────────────────────────────────────────
    const updateAIConfig = async () => {
        if (!editingAIInstance) return;
        setSavingAI(true);
        try {
            const headers = await getAuthHeader();
            const url = `${API}/instances/${editingAIInstance.id}/prompt`;
            console.log("[DEBUG] Salvando prompt em:", url);
            await axios.post(url, {
                system_prompt: tempPrompt,
                ai_delay_min: tempDelayMin,
                ai_delay_max: tempDelayMax
            }, { headers });

            toast.success("Configurações da IA atualizadas! 🤖✨");
            setShowPromptModal(false);
            fetchInstances();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Erro ao salvar configurações");
        } finally {
            setSavingAI(false);
        }
    };

    // ── Limpar Memória IA ──────────────────────────────────────────
    const resetAIMemory = async (instanceId: string) => {
        try {
            const headers = await getAuthHeader();
            await axios.delete(`${API}/instances/${instanceId}/memory`, { headers });
            toast.success("Memória do Agente limpa com sucesso! 🧹✨");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Erro ao limpar memória do agente");
        }
    };


    // ── Toggle AI Agent ──────────────────────────────────────────
    const toggleAIAgent = async (instance: any) => {
        try {
            const newStatus = !instance.ai_active;
            const headers = await getAuthHeader();
            await axios.post(`${API}/instances/${instance.id}/ai`, { ai_active: newStatus }, { headers });

            toast.success(`Agente IA ${newStatus ? 'Ativado' : 'Desativado'}! 🤖`);

            // Update local state to avoid full refetch immediately
            setInstances(prev => prev.map(i => i.id === instance.id ? { ...i, ai_active: newStatus } : i));
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Erro ao alterar Agente IA");
        }
    };

    // ── Abrir Modal de Edição de IA ──────────────────────────────
    const openAIModal = (instance: any, tab = "behavior") => {
        setEditingAIInstance(instance);
        setTempPrompt(instance.system_prompt || "");
        setTempDelayMin(instance.ai_delay_min || 2000);
        setTempDelayMax(instance.ai_delay_max || 5000);
        setActiveAITab(tab);
        setShowPromptModal(true);
    };

    // --- HUMAN HANDOVER & RODIZIO FUNCTIONS ---
    const openHandoverModal = async (instance: any) => {
        setEditingHandoverInstance(instance);
        setHandoverTriggers(instance.human_handover_triggers || "");
        setAdminNotificationPhone(instance.notification_phone || "");
        setRoundRobinActive(instance.round_robin_active !== false); // Default to true
        setShowHandoverModal(true);
        fetchAttendants(instance.id);
    };

    const fetchAttendants = async (instanceId: string) => {
        setLoadingHandover(true);
        try {
            const headers = await getAuthHeader();
            const { data } = await axios.get(`${API}/instances/${instanceId}/attendants`, { headers });
            setAttendants(data);
        } catch (err: any) {
            console.error("Erro ao buscar atendentes:", err.message);
        } finally {
            setLoadingHandover(false);
        }
    };

    const saveHandoverConfig = async () => {
        if (!editingHandoverInstance) return;
        setSavingHandover(true);
        try {
            const headers = await getAuthHeader();
            await axios.post(`${API}/instances/${editingHandoverInstance.id}/handover`, {
                human_handover_triggers: handoverTriggers,
                notification_phone: adminNotificationPhone,
                round_robin_active: roundRobinActive
            }, { headers });

            setInstances(prev => prev.map(inst =>
                inst.id === editingHandoverInstance.id
                    ? { ...inst, human_handover_triggers: handoverTriggers, notification_phone: adminNotificationPhone, round_robin_active: roundRobinActive }
                    : inst
            ));

            toast.success("Configuração de handover salva! ✅");
        } catch (err: any) {
            toast.error("Falha ao salvar configuração");
        } finally {
            setSavingHandover(false);
        }
    };

    const addAttendant = async () => {
        if (!newAttName.trim() || !newAttPhone.trim()) return toast.error("Preencha nome e telefone");
        try {
            const headers = await getAuthHeader();
            await axios.post(`${API}/instances/${editingHandoverInstance.id}/attendants`, {
                name: newAttName.trim(),
                phone: newAttPhone.trim().replace(/[^0-9]/g, "")
            }, { headers });
            setNewAttName("");
            setNewAttPhone("");
            fetchAttendants(editingHandoverInstance.id);
            toast.success("Atendente adicionado! ✅");
        } catch (err: any) {
            toast.error("Erro ao adicionar atendente");
        }
    };

    const deleteAttendant = async (id: string) => {
        try {
            const headers = await getAuthHeader();
            await axios.delete(`${API}/attendants/${id}`, { headers });
            fetchAttendants(editingHandoverInstance.id);
            toast.success("Atendente removido.");
        } catch (err: any) {
            toast.error("Erro ao remover");
        }
    };

    // --- Leads em Atendimento Functions ---
    const openLeadsModal = async (instance: any) => {
        setEditingLeadsInstance(instance);
        setShowLeadsModal(true);
        fetchHandoverLeads(instance.id);
    };

    const fetchHandoverLeads = async (instanceId: string) => {
        setLoadingLeads(true);
        try {
            const headers = await getAuthHeader();
            const { data } = await axios.get(`${API}/instances/${instanceId}/handover/leads`, { headers });
            setHandoverLeads(data);
        } catch (err: any) {
            toast.error("Erro ao buscar leads pausados");
        } finally {
            setLoadingLeads(false);
        }
    };

    const reactivateAI = async (instanceId: string, jid: string) => {
        try {
            const headers = await getAuthHeader();
            await axios.post(`${API}/instances/${instanceId}/handover/leads/${jid}/reactivate`, {}, { headers });
            toast.success("IA Reativada para este contato! 🤖✅");
            fetchHandoverLeads(instanceId);
        } catch (err: any) {
            toast.error("Erro ao reativar IA");
        }
    };

    const openKnowledgeModal = (instance: any) => {
        openAIModal(instance, "knowledge");
    };

    // ── Loading screen ─────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    // ── Tela de Disparo em Massa ───────────────────────────────
    if (massDispatchInstance) {
        return (
            <MassDispatch
                instance={massDispatchInstance}
                onClose={() => setMassDispatchInstance(null)}
            />
        );
    }

    // ── Main render ────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Canais / Conexões</h1>
                    <p className="text-gray-500 text-sm">Gerencie suas conexões de WhatsApp e API.</p>
                </div>
                <div className="flex gap-2">
                    <Input
                        placeholder="Nome da conexão (ex: Suporte)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && createInstance()}
                        className="w-64"
                    />
                    <Button onClick={createInstance} disabled={creating} className="bg-purple-600 hover:bg-purple-700">
                        {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        Nova Conexão
                    </Button>
                </div>
            </div>

            {/* Grid de cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12">
                {instances.map((instance) => (
                    <InstanceCard
                        key={instance.id}
                        instance={instance}
                        secondsAgo={secondsAgo}
                        onDelete={deleteInstance}
                        onLogout={logoutInstance}
                        onGetQR={fetchQRCode}
                        onPairing={(id) => {
                            setSelectedInstance(id);
                            setShowPairingInput(true);
                            setPhoneNumber("");
                        }}
                        onMassDispatch={setMassDispatchInstance}
                        onToggleAI={toggleAIAgent}
                        onEditAI={openAIModal}
                        onResetMemory={resetAIMemory}
                        onOpenHandover={openHandoverModal}
                        onOpenLeads={openLeadsModal}
                        onOpenKnowledge={openKnowledgeModal}
                    />
                ))}
            </div>

            {/* Empty state */}
            {instances.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Link2 className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Nenhuma conexão ativa</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mt-1">Crie sua primeira conexão para começar a enviar mensagens via API.</p>
                </div>
            )}

            {/* Modal: Carregando QR */}
            {selectedInstance && qrLoading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold">Gerando...</h3>
                        <p className="text-gray-500 text-sm mt-2">Isso pode levar alguns segundos.</p>
                    </div>
                </div>
            )}

            {/* Modal: QR Code */}
            {/* Existing QR Modal content... */}

            {/* Modal: Agente IA (Configuração + Base de Conhecimento) */}
            {showPromptModal && editingAIInstance && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-purple-100 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                        {/* Header */}
                        <div className="p-4 sm:p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Configurar Agente IA</h3>
                                    <p className="text-purple-100 text-xs mt-0.5">{editingAIInstance.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowPromptModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <Tabs value={activeAITab} onValueChange={setActiveAITab} className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 pt-4 bg-gray-50/50 border-b border-gray-100">
                                <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 p-1 rounded-xl">
                                    <TabsTrigger value="behavior" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all">
                                        🤖 Comportamento
                                    </TabsTrigger>
                                    <TabsTrigger value="knowledge" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all">
                                        📚 Conhecimento (RAG)
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <TabsContent value="behavior" className="mt-0 space-y-6 animate-in slide-in-from-left-2 duration-300">
                                    {/* System Prompt Section */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <ClipboardList className="w-4 h-4 text-purple-600" />
                                            System Prompt (O Cérebro do Agente)
                                        </label>
                                        <div className="relative group">
                                            <textarea
                                                value={tempPrompt}
                                                onChange={(e) => setTempPrompt(e.target.value)}
                                                placeholder="Ex: Você é o suporte da empresa X, seja educado e tente agendar uma reunião..."
                                                className="w-full min-h-[180px] p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-sm text-gray-700 leading-relaxed resize-none"
                                            />
                                            <div className="absolute top-4 right-4 text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100 uppercase tracking-wider">Instruções</div>
                                        </div>
                                    </div>

                                    {/* Delay Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2.5">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide px-1">Delay Mínimo (ms)</label>
                                            <div className="relative group">
                                                <Input
                                                    type="number"
                                                    value={tempDelayMin}
                                                    onChange={(e) => setTempDelayMin(parseInt(e.target.value))}
                                                    className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:border-purple-500 transition-all"
                                                />
                                                <div className="absolute right-3 top-3.5 text-[10px] font-bold text-gray-400 uppercase">ms</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide px-1">Delay Máximo (ms)</label>
                                            <div className="relative group">
                                                <Input
                                                    type="number"
                                                    value={tempDelayMax}
                                                    onChange={(e) => setTempDelayMax(parseInt(e.target.value))}
                                                    className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:border-purple-500 transition-all"
                                                />
                                                <div className="absolute right-3 top-3.5 text-[10px] font-bold text-gray-400 uppercase">ms</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-start gap-3">
                                        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                            <Activity className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-blue-800">Humanização Ativa</h4>
                                            <p className="text-[11px] text-blue-600/80 mt-0.5">A IA vai escolher um tempo aleatório entre o mínimo e o máximo para responder.</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="knowledge" className="mt-0 h-full animate-in slide-in-from-right-2 duration-300">
                                    <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100/50 flex items-start gap-3 mb-4">
                                        <div className="p-1.5 bg-yellow-100 rounded-lg text-yellow-600">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-yellow-800">Base Privada</h4>
                                            <p className="text-[11px] text-yellow-600/80 mt-0.5">Os arquivos carregados aqui serão usados apenas por este canal/agente.</p>
                                        </div>
                                    </div>
                                    <KnowledgeBase instanceId={editingAIInstance.id} />
                                </TabsContent>
                            </div>
                        </Tabs>

                        {/* Footer - Only show buttons if behavior tab is active */}
                        {activeAITab === "behavior" && (
                            <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowPromptModal(false)}
                                    className="rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={updateAIConfig}
                                    disabled={savingAI}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-12 px-8 rounded-xl shadow-xl shadow-purple-200 min-w-[140px]"
                                >
                                    {savingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Configurações"}
                                </Button>
                            </div>
                        )}
                        {activeAITab === "knowledge" && (
                            <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-center">
                                <p className="text-[10px] text-gray-400 font-medium italic">As alterações na base de conhecimento são salvas automaticamente após o upload.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {qrCode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">QR Code</h3>
                            <Button variant="ghost" size="icon" onClick={() => { setQrCode(""); setSelectedInstance(null); }}>
                                <XCircle className="w-6 h-6 text-gray-400" />
                            </Button>
                        </div>
                        <div className="bg-white p-4 rounded-xl border-2 border-purple-100 mb-6 flex justify-center">
                            <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                        </div>
                        <p className="text-sm text-gray-500 px-2">
                            Abra o WhatsApp → Configurações → Dispositivos Conectados → Conectar um dispositivo.
                        </p>
                    </div>
                </div>
            )}

            {/* Modal: Input número para pareamento */}
            {showPairingInput && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Emparelhar via Número</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowPairingInput(false)}>
                                <XCircle className="w-6 h-6 text-gray-400" />
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500">Digite seu número com DDI e DDD (ex: 5511999999999).</p>
                        <Input
                            placeholder="Ex: 5511999999999"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchPairingCode()}
                            className="text-base h-11"
                        />
                        <Button
                            onClick={fetchPairingCode}
                            className="w-full bg-blue-600 hover:bg-blue-700 h-11"
                            disabled={qrLoading}
                        >
                            {qrLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Gerar Código
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal: Exibir código de pareamento */}
            {pairingCode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Código Gerado</h3>
                            <Button variant="ghost" size="icon" onClick={() => { setPairingCode(""); setSelectedInstance(null); }}>
                                <XCircle className="w-6 h-6 text-gray-400" />
                            </Button>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 mb-6 flex items-center justify-center">
                            <span className="text-4xl font-mono tracking-widest font-bold text-gray-900 break-all">{pairingCode}</span>
                        </div>
                        <p className="text-sm text-gray-500 px-2">
                            Abra o WhatsApp → Dispositivos Conectados → Conectar usando número de telefone.
                        </p>
                    </div>
                </div>
            )}
            {/* Modal: Handover & Rodízio */}
            {showHandoverModal && editingHandoverInstance && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-purple-100 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-green-600 to-teal-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Temas para Humano & Rodízio</h3>
                                    <p className="text-green-100 text-xs mt-0.5">Configure quando a IA deve parar e quem deve atender: {editingHandoverInstance.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowHandoverModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-8">
                            {/* Gatilhos e Admin Section */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <Target className="w-4 h-4 text-green-600" />
                                        Gatilhos de Handover (Palavras-chave)
                                    </label>
                                    <textarea
                                        value={handoverTriggers}
                                        onChange={(e) => setHandoverTriggers(e.target.value)}
                                        placeholder="Ex: falar com humano, preço, atendente, ajuda (separados por vírgula)"
                                        className="w-full h-24 p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    />
                                    <p className="text-[10px] text-gray-400">Use palavras-chave separadas por <b>vírgula</b> (ex: suporte, humano, atendente). Frases longas não funcionam bem aqui; a IA agora também detecta o desejo do lead de forma inteligente.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Telefone Admin (Backup)</label>
                                    <Input
                                        placeholder="Ex: 5511999999999"
                                        value={adminNotificationPhone}
                                        onChange={(e) => setAdminNotificationPhone(e.target.value)}
                                        className="h-10 rounded-xl"
                                    />
                                    <p className="text-[10px] text-gray-400">Usado se não houver atendentes no rodízio.</p>
                                </div>

                                <Button
                                    onClick={saveHandoverConfig}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white h-10 rounded-xl font-bold shadow-md shadow-green-100"
                                    disabled={savingHandover}
                                >
                                    {savingHandover ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Salvar Gatilhos & Admin
                                </Button>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Rodízio Section */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-blue-600" />
                                            <Label className="text-sm font-bold text-gray-700">Rodízio Ativo</Label>
                                        </div>
                                        <p className="text-[10px] text-gray-500">Se desativado, apenas o Telefone Admin será notificado.</p>
                                    </div>
                                    <Switch
                                        checked={roundRobinActive}
                                        onCheckedChange={setRoundRobinActive}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <ClipboardList className="w-4 h-4 text-blue-600" />
                                        Gerenciar Atendentes
                                    </h4>
                                    {roundRobinActive && attendants.length > 0 && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0 px-2 animate-pulse">
                                            Na vez: {attendants.sort((a, b) => (a.last_handover_at || "").localeCompare(b.last_handover_at || ""))[0]?.name || "Ninguém"}
                                        </Badge>
                                    )}
                                </div>

                                {/* Form Adicionar */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome do Atendente</label>
                                        <Input
                                            placeholder="Ex: João"
                                            value={newAttName}
                                            onChange={(e) => setNewAttName(e.target.value)}
                                            className="bg-white h-9 rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">WhatsApp (DDI+DDD)</label>
                                        <Input
                                            placeholder="Ex: 5511..."
                                            value={newAttPhone}
                                            onChange={(e) => setNewAttPhone(e.target.value)}
                                            className="bg-white h-9 rounded-lg"
                                        />
                                    </div>
                                    <Button
                                        onClick={addAttendant}
                                        className="md:col-span-2 bg-blue-600 hover:bg-blue-700 h-9 font-bold text-xs rounded-lg"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar à Fila
                                    </Button>
                                </div>

                                {/* Lista Atendentes */}
                                <div className="space-y-2">
                                    {loadingHandover ? (
                                        <div className="flex justify-center p-4">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        </div>
                                    ) : attendants.length === 0 ? (
                                        <p className="text-center text-xs text-gray-400 py-4 italic">Nenhum atendente cadastrado no rodízio.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
                                            {attendants.map((att) => (
                                                <div key={att.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition-colors shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                            {att.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-800">{att.name}</p>
                                                            <p className="text-[10px] text-gray-500">+{att.phone}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-300 hover:text-red-500 transition-colors"
                                                        onClick={() => deleteAttendant(att.id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                            <p className="text-[10px] text-gray-400">As notificações de handover incluem Lead, Número e Resumo da Conversa.</p>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal: Leads em Atendimento */}
            {showLeadsModal && editingLeadsInstance && (
                // ... Existing Leads Modal code ...
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-orange-100 flex flex-col max-h-[80vh]">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-orange-500 to-red-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-bold">Leads em Atendimento</h3>
                                    <p className="text-orange-100 text-xs mt-0.5">IA pausada para estes contatos ({editingLeadsInstance.name})</p>
                                </div>
                            </div>
                            <button onClick={() => setShowLeadsModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto min-h-[300px]">
                            {loadingLeads ? (
                                <div className="flex flex-col items-center justify-center h-48 space-y-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                    <p className="text-gray-400 text-sm">Buscando leads pausados...</p>
                                </div>
                            ) : handoverLeads.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 space-y-3 text-center">
                                    <Activity className="w-12 h-12 text-gray-200" />
                                    <p className="text-gray-400 text-sm italic">Nenhum lead com IA pausada no momento.<br />O robô está cuidando de tudo! 🤖✅</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {handoverLeads.map((lead) => (
                                        <div key={lead.id} className="flex items-center justify-between p-4 bg-orange-50/30 border border-orange-100 rounded-2xl hover:bg-orange-50/50 transition-all shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <Smartphone className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{lead.remote_jid.split('@')[0]}</p>
                                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                        <Activity className="w-3 h-3" />
                                                        Pausado em: {new Date(lead.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => reactivateAI(editingLeadsInstance.id, lead.remote_jid)}
                                                className="border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl text-xs font-bold transition-all px-4"
                                            >
                                                Reativar IA
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                            <p className="text-[10px] text-gray-400">Ao clicar em "Reativar IA", o robô voltará a responder este contato imediatamente.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Base de Conhecimento (PDF) Removido pois agora está dentro do Agente IA */}
        </div>
    );
};

// ── Instance Card ────────────────────────────────────────────────
interface InstanceCardProps {
    instance: any;
    secondsAgo: number;
    onDelete: (id: string) => void;
    onLogout: (id: string) => void;
    onGetQR: (id: string) => void;
    onPairing: (id: string) => void;
    onMassDispatch: (instance: any) => void;
    onToggleAI: (instance: any) => void;
    onEditAI: (instance: any) => void;
    onResetMemory: (id: string) => void;
    onOpenHandover: (instance: any) => void;
    onOpenLeads: (instance: any) => void;
    onOpenKnowledge: (instance: any) => void;
}

const InstanceCard = ({
    instance,
    secondsAgo,
    onDelete,
    onLogout,
    onGetQR,
    onPairing,
    onMassDispatch,
    onToggleAI,
    onEditAI,
    onResetMemory,
    onOpenHandover,
    onOpenLeads,
    onOpenKnowledge
}: InstanceCardProps) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showAIMenu, setShowAIMenu] = useState(false);

    const menuItems = [
        { icon: Send, label: "DISPARO EM MASSA", color: "text-blue-600", action: () => { onMassDispatch(instance); setShowMenu(false); } },
        { icon: Bot, label: "AGENTE DE IA", color: "text-purple-600", action: () => { setShowAIMenu(true); } },
        { icon: Users, label: "RODÍZIO DE ATENDIMENTO", color: "text-green-600", action: () => { onOpenHandover(instance); setShowMenu(false); } },
        { icon: Target, label: "LEADS EM ATENDIMENTO", color: "text-orange-600", action: () => { onOpenLeads(instance); setShowMenu(false); } },
    ];

    const aiMenuItems = [
        {
            label: instance.ai_active ? "Desativar IA" : "Ativar IA",
            emoji: instance.ai_active ? "🔴" : "🟢",
            action: () => {
                onToggleAI(instance);
                setShowAIMenu(false);
            }
        },
        {
            label: "Editar System Prompt",
            emoji: "📝",
            action: () => {
                onEditAI(instance);
                setShowAIMenu(false);
            }
        },
        {
            label: "Resetar Memória",
            emoji: "🧹",
            action: () => {
                if (window.confirm("Isso apagará o histórico da IA para esta instância e ela esquecerá todo o contexto recente. Confirmar?")) {
                    onResetMemory(instance.id);
                }
                setShowAIMenu(false);
            }
        },
        {
            label: "Temas para Humano",
            emoji: "🤝",
            action: () => {
                onOpenHandover(instance);
                setShowAIMenu(false);
            }
        },
        {
            label: "Base de Conhecimento (PDF)",
            emoji: "📚",
            action: () => {
                onOpenKnowledge(instance);
                setShowAIMenu(false);
                setShowMenu(false);
            }
        },
        { label: "Tempo de Reativação", emoji: "🕓" },
        { label: "Follow-ups", emoji: "🔔" },
    ];

    return (
        <Card className="w-full shadow-2xl border-0 bg-white group relative overflow-hidden h-fit transition-all duration-300 hover:shadow-purple-100/50">
            <div className={`absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-1000 pointer-events-none ${instance.ai_active ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-purple-600 to-blue-600'}`} />

            <CardContent className="p-4 relative">
                {/* Avatar + Info */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg relative shrink-0 ${instance.ai_active ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-gradient-to-br from-purple-500 to-purple-700'}`}>
                            {instance.avatarUrl ? (
                                <img src={instance.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <MessageCircle className="w-8 h-8 text-white" strokeWidth={2} />
                            )}
                            {instance.status === "connected" && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-0.5 truncate">{instance.name}</h3>
                            <p className="text-xs text-gray-500 mb-1.5 truncate">
                                {instance.status === "connected" && instance.phone ? `+${instance.phone}` : "Aguardando Conexão"}
                            </p>

                            {instance.ai_active && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0 mb-1.5 font-bold uppercase tracking-wider h-4 flex w-fit items-center gap-1 shadow-sm">
                                    <Bot className="w-2.5 h-2.5" />
                                    Agente IA Ativado
                                </Badge>
                            )}

                            <div className="flex items-center gap-1.5">
                                <Activity className={`w-3 h-3 ${secondsAgo < 6 ? "text-green-500" : "text-gray-400"}`} />
                                <span className="text-[10px] font-medium text-gray-500">
                                    {secondsAgo === 0 ? "Sincronizando..." : `Há ${secondsAgo}s`}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <Badge className={`text-[10px] h-5 px-1.5 ${instance.status === "connected" ? "bg-green-100 text-green-700 hover:bg-green-100 border-0 font-semibold shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-100 border-0 font-semibold shadow-sm"}`}>
                            {instance.status === "connected" ? "Conectado" : "Desconectado"}
                        </Badge>
                        <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={(e) => { e.stopPropagation(); onDelete(instance.id); }}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                    {instance.status !== "connected" ? (
                        <>
                            <Button
                                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold h-10 shadow-lg shadow-purple-200 text-xs"
                                onClick={() => onGetQR(instance.id)}
                            >
                                <QrCode className="w-3.5 h-3.5 mr-2" /> Gerar QR Code
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full border-blue-100 text-blue-600 hover:bg-blue-50 h-10 font-bold text-xs"
                                onClick={() => onPairing(instance.id)}
                            >
                                <Smartphone className="w-3.5 h-3.5 mr-2" /> Código de Pareamento
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold h-10 text-xs"
                                onClick={() => { setShowMenu(!showMenu); setShowAIMenu(false); }}
                            >
                                <Settings className="w-3.5 h-3.5 mr-2" />
                                {showMenu ? "Recolher Menu" : "Gerenciar Instância"}
                            </Button>

                            {showMenu && !showAIMenu && (
                                <div className="w-full bg-white border border-purple-50 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-3 py-1.5 text-[9px] font-bold text-purple-400 uppercase tracking-widest bg-purple-50/50">Opções Avançadas</div>
                                    {menuItems.map((item, i) => (
                                        <button
                                            key={i}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-purple-50/50 transition-colors border-b border-purple-50 last:border-b-0 text-left group"
                                            onClick={() => item.action()}
                                        >
                                            <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                                            <span className="text-xs font-bold text-gray-700">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {showAIMenu && (
                                <div className="w-full bg-white border border-purple-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex items-center justify-between p-2.5 border-b border-purple-50 bg-gradient-to-r from-purple-50 to-white">
                                        <div className="flex items-center gap-2 text-purple-700">
                                            <Bot className="w-3.5 h-3.5" />
                                            <h3 className="font-bold text-xs">Configurar Agente IA</h3>
                                        </div>
                                        <button
                                            onClick={() => { setShowAIMenu(false); setShowMenu(true); }}
                                            className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="max-h-[250px] overflow-y-auto">
                                        {aiMenuItems.map((item, i) => (
                                            <button
                                                key={i}
                                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-purple-50 transition-colors border-b border-purple-50 last:border-b-0 text-left group"
                                                onClick={() => {
                                                    if (item.action) {
                                                        item.action();
                                                    } else {
                                                        toast.info(`Menu IA: ${item.label}`);
                                                    }
                                                }}
                                            >
                                                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-base group-hover:bg-white transition-colors">
                                                    {item.emoji}
                                                </div>
                                                <span className="text-xs font-bold text-gray-700">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                className="w-full text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 h-9 font-bold text-[11px]"
                                onClick={() => onLogout(instance.id)}
                            >
                                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Desconectar WhatsApp
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default Canais;
