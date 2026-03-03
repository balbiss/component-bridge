import React, { useEffect, useState } from 'react';
import {
    Clock,
    CheckCircle2,
    XCircle,
    PlayCircle,
    MoreVertical,
    Trash2,
    Calendar,
    MessageSquare,
    Loader2,
    StopCircle,
    ChevronRight,
    Search,
    Filter
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    getAuthHeader,
    API
} from '@/lib/api';
import axios from 'axios';
import { toast } from 'sonner';
import { CampaignDetailDrawer } from './CampaignDetailDrawer';

interface Campaign {
    id: string;
    name: string;
    status: 'scheduled' | 'running' | 'completed' | 'error';
    scheduled_at: string;
    total_contacts: number;
    current_index: number;
    created_at: string;
    instance_name?: string;
    instance_phone?: string;
}

const CampaignHistory: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [searchName, setSearchName] = useState('');
    const [searchDate, setSearchDate] = useState('');

    const fetchCampaigns = async () => {
        try {
            console.log('[CampaignHistory] Fetching campaigns from:', `${API}/campaigns`);
            const headers = await getAuthHeader();
            const resp = await axios.get(`${API}/campaigns`, { headers });
            console.log('[CampaignHistory] Received:', resp.data.length, 'campaigns');
            setCampaigns(resp.data);
        } catch (err: any) {
            console.error('[CampaignHistory] error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Deseja realmente cancelar este disparo? Ele não poderá ser retomado.')) return;
        try {
            const headers = await getAuthHeader();
            await axios.post(`${API}/campaigns/${id}/cancel`, {}, { headers });
            toast.success('Campanha cancelada');
            fetchCampaigns();
        } catch (err) {
            toast.error('Erro ao cancelar campanha');
        }
    };

    const handleDelete = async (id: string, status: string) => {
        const msg = status === 'running'
            ? 'Esta campanha está em execução. Deseja realmente excluí-la? O disparo será interrompido.'
            : 'Deseja excluir este registro de campanha?';

        if (!confirm(msg)) return;

        try {
            const headers = await getAuthHeader();
            await axios.delete(`${API}/campaigns/${id}`, { headers });
            toast.success('Campanha excluída');
            fetchCampaigns();
        } catch (err) {
            toast.error('Erro ao excluir campanha');
        }
    };

    useEffect(() => {
        fetchCampaigns();

        // Polling para progresso em tempo real
        const interval = setInterval(() => {
            fetchCampaigns();
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1"><Clock className="w-3 h-3" /> Agendado</Badge>;
            case 'running':
                return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processando</Badge>;
            case 'completed':
                return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Concluído</Badge>;
            case 'error':
                return <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-100 flex items-center gap-1"><XCircle className="w-3 h-3" /> Erro</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading && campaigns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-sm font-medium">Carregando histórico...</p>
            </div>
        );
    }

    if (!loading && campaigns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Nenhuma campanha encontrada</p>
                <p className="text-xs mt-1">Seus disparos em massa aparecerão aqui.</p>
            </div>
        );
    }

    const filteredCampaigns = campaigns.filter(camp => {
        const matchName = !searchName || camp.name.toLowerCase().includes(searchName.toLowerCase());
        const matchDate = !searchDate || new Date(camp.scheduled_at).toLocaleDateString('pt-BR') === new Date(searchDate + 'T12:00:00').toLocaleDateString('pt-BR');
        return matchName && matchDate;
    });

    if (!loading && filteredCampaigns.length === 0 && campaigns.length > 0) {
        return (
            <>
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome da campanha..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-600"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                    <Search className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium">Nenhuma campanha encontrada com esses filtros</p>
                    <button onClick={() => { setSearchName(''); setSearchDate(''); }} className="mt-4 text-xs font-semibold text-purple-600 hover:text-purple-700">
                        Limpar filtros
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Filtros */}
            {campaigns.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome da campanha..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-600"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Campanha</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Progresso</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Data/Hora</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredCampaigns.map((camp) => {
                            const progress = camp.total_contacts > 0
                                ? Math.round((camp.current_index / camp.total_contacts) * 100)
                                : 0;

                            return (
                                <tr key={camp.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-5 py-4">
                                        <div>
                                            <button
                                                onClick={() => setSelectedCampaign(camp)}
                                                className="group flex items-center gap-1 text-sm font-bold text-gray-900 hover:text-purple-700 transition-colors text-left"
                                            >
                                                <span>{camp.name}</span>
                                                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-purple-500" />
                                            </button>
                                            <p className="text-[10px] text-gray-400">ID: {camp.id.substring(0, 8)}</p>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                Instância: <span className="font-medium text-gray-700">{camp.instance_name}</span> {camp.instance_phone && camp.instance_phone !== 'Desconhecido' ? `(${camp.instance_phone})` : ''}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {getStatusBadge(camp.status)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${camp.status === 'completed' ? 'bg-green-500' : 'bg-purple-600'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700">{camp.current_index}/{camp.total_contacts}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-medium leading-none">
                                                {new Date(camp.scheduled_at).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {(camp.status === 'running' || camp.status === 'scheduled') && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleCancel(camp.id)}
                                                        className="text-amber-600 focus:text-amber-700 cursor-pointer"
                                                    >
                                                        <StopCircle className="w-4 h-4 mr-2" />
                                                        Cancelar
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(camp.id, camp.status)}
                                                    className="text-red-600 focus:text-red-700 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <CampaignDetailDrawer
                campaign={selectedCampaign}
                onClose={() => setSelectedCampaign(null)}
            />
        </>
    );
};

export default CampaignHistory;
