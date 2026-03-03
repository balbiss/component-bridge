import React, { useEffect, useState } from 'react';
import { X, Download, CheckCircle2, XCircle, Clock, Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { API } from '@/lib/api';
import * as XLSX from 'xlsx';

interface LogEntry {
    phone: string;
    name?: string;
    status: 'success' | 'error' | 'skipped';
    error?: string;
    ts?: string;
}

interface Campaign {
    id: string;
    name: string;
    results?: LogEntry[];
    total_contacts?: number;
    status?: string;
    scheduled_at?: string;
    instance_name?: string;
    instance_phone?: string;
}

interface Props {
    campaign: Campaign | null;
    onClose: () => void;
}

const STATUS_CONFIG = {
    success: { label: 'Enviado', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    error: { label: 'Erro', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    skipped: { label: 'Ignorado', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
};

export function CampaignDetailDrawer({ campaign, onClose }: Props) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!campaign) return;
        setLoading(true);

        const fetchLogs = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setLoading(false); return; }

            const res = await fetch(`${API}/campaigns/${campaign.id}/logs`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setLogs(json.results || []);
            }
            setLoading(false);
        };

        fetchLogs();
    }, [campaign]);

    const exportExcel = () => {
        if (!logs.length) return;
        const rows = logs.map((l, i) => ({
            '#': i + 1,
            Telefone: l.phone,
            Nome: l.name || '',
            Status: STATUS_CONFIG[l.status]?.label || l.status,
            Erro: l.error || '',
            'Data/Hora': l.ts ? new Date(l.ts).toLocaleString() : '',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Histórico');
        XLSX.writeFile(wb, `${campaign?.name || 'campanha'}.xlsx`);
    };

    if (!campaign) return null;

    const successCount = logs.filter(l => l.status === 'success').length;
    const errorCount = logs.filter(l => l.status === 'error').length;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 truncate max-w-xs">{campaign.name}</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : ''}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 mb-1 text-gray-600">
                            <Smartphone className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">
                                {campaign.instance_name || 'Desconhecida'} {campaign.instance_phone && campaign.instance_phone !== 'Desconhecido' ? `(${campaign.instance_phone})` : ''}
                            </span>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                ✓ {successCount} enviados
                            </span>
                            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                ✗ {errorCount} erros
                            </span>
                            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                Total: {logs.length}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2 text-green-700 border-green-300 hover:bg-green-50"
                            onClick={exportExcel}
                            disabled={!logs.length}
                        >
                            <Download className="w-4 h-4" />
                            Baixar Excel
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <span className="text-sm">Carregando histórico...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <Clock className="w-8 h-8 mb-2" />
                            <span className="text-sm">Nenhum registro encontrado</span>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefone</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Erro / Info</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {logs.map((log, i) => {
                                    const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.error;
                                    const Icon = cfg.icon;
                                    return (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 text-gray-400 tabular-nums">{i + 1}</td>
                                            <td className="px-4 py-3 font-mono text-gray-800">{log.phone}</td>
                                            <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{log.name || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={log.error}>
                                                {log.error || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-400 tabular-nums whitespace-nowrap">
                                                {log.ts ? new Date(log.ts).toLocaleTimeString() : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
