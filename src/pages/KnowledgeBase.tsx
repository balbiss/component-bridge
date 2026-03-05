import React, { useState, useEffect } from 'react';
import {
    FileText,
    Upload,
    Trash2,
    FilePlus,
    Search,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FileCode
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { supabase } from "@/lib/supabase";
import { getAuthHeader, API } from '@/lib/api';
import axios from 'axios';

interface KnowledgeDocument {
    id: string;
    file_name: string;
    file_size: number;
    status: 'pending' | 'processing' | 'completed' | 'error';
    created_at: string;
}

interface KnowledgeBaseProps {
    instanceId?: string;
}

const KnowledgeBase = ({ instanceId }: KnowledgeBaseProps) => {
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchDocuments = async () => {
        try {
            let query = supabase
                .from('knowledge_documents')
                .select('*')
                .order('created_at', { ascending: false });

            if (instanceId) {
                query = query.eq('instance_id', instanceId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setDocuments(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar documentos:', err.message);
            toast.error('Falha ao carregar documentos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
        // Polling opcional para atualizar status de processamento
        const interval = setInterval(fetchDocuments, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            return toast.error('Apenas arquivos PDF são permitidos');
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            return toast.error('O arquivo deve ter no máximo 10MB');
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (instanceId) {
            formData.append('instanceId', instanceId);
        }

        try {
            const headers = await getAuthHeader();
            // Usaremos o endpoint do backend para gerenciar storage + db + processamento
            await axios.post(`${API}/knowledge/upload`, formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Upload concluído! Verificando documento...');
            fetchDocuments();
        } catch (err: any) {
            console.error('Erro no upload:', err.response?.data || err.message);
            toast.error(err.response?.data?.error || 'Erro ao enviar arquivo');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente remover este documento da Base de Conhecimento?')) return;

        try {
            const headers = await getAuthHeader();
            await axios.delete(`${API}/knowledge/${id}`, { headers });
            toast.success('Documento removido');
            fetchDocuments();
        } catch (err: any) {
            toast.error('Erro ao deletar documento');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">Pendente</Badge>;
            case 'processing':
                return <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 animate-pulse"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processando</Badge>;
            case 'completed':
                return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Concluído</Badge>;
            case 'error':
                return <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100"><AlertCircle className="w-3 h-3 mr-1" /> Erro</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredDocs = documents.filter(doc =>
        doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`space-y-6 ${!instanceId ? 'animate-in fade-in duration-500' : ''}`}>
            {/* Header - Only show if not in a specific instance context (e.g. main page) */}
            {!instanceId && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Base de Conhecimento (PDF)</h2>
                        <p className="text-sm text-gray-500 mt-1">Carregue documentos para treinar o cérebro dos seus Agentes de IA.</p>
                    </div>
                    <div className="relative">
                        <Input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                            id="pdf-upload"
                        />
                        <label htmlFor="pdf-upload">
                            <Button asChild disabled={uploading} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 cursor-pointer">
                                <span>
                                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FilePlus className="w-4 h-4 mr-2" />}
                                    {uploading ? 'Enviando...' : 'Adicionar PDF'}
                                </span>
                            </Button>
                        </label>
                    </div>
                </div>
            )}

            {/* Stats Cards - Only show on main page */}
            {!instanceId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Total de Documentos</p>
                            <p className="text-xl font-bold text-gray-900">{documents.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Processados com Sucesso</p>
                            <p className="text-xl font-bold text-gray-900">{documents.filter(d => d.status === 'completed').length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <FileCode className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Busca Semântica Ativa</p>
                            <p className="text-sm font-bold text-amber-600 pt-1">Pronto para RAG ⚡</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-between">
                        <h3 className="text-base font-bold text-gray-900 whitespace-nowrap">Documentos da Base</h3>

                        {/* Internal Upload for Modal view */}
                        {instanceId && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="hidden"
                                    id="pdf-upload-modal"
                                />
                                <label htmlFor="pdf-upload-modal">
                                    <Button asChild size="sm" disabled={uploading} className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer h-9 px-4 rounded-xl">
                                        <span>
                                            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FilePlus className="w-4 h-4 mr-2" />}
                                            {uploading ? 'Enviando...' : 'Adicionar PDF'}
                                        </span>
                                    </Button>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Buscar documento..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-sm rounded-xl border-gray-200"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p className="text-sm font-medium">Carregando base de conhecimento...</p>
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-sm font-medium">Nenhum documento encontrado</p>
                        <p className="text-xs mt-1">Carregue um PDF para começar a treinar sua IA.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Documento</th>
                                    <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tamanho</th>
                                    <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Data de Envio</th>
                                    <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 leading-none">{doc.file_name}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">ID: {doc.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-medium text-gray-600">
                                            {formatFileSize(doc.file_size)}
                                        </td>
                                        <td className="px-5 py-4">
                                            {getStatusBadge(doc.status)}
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-500">
                                            {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(doc.id)}
                                                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBase;
