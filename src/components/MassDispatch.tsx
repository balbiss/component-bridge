import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, Loader2, XCircle, Upload, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:3003/api';

async function getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Sessão expirada. Faça login novamente.');
    return { Authorization: `Bearer ${session.access_token}` };
}

// ── Tipos ──────────────────────────────────────────────────────
type MediaType = 'text' | 'image' | 'video' | 'audio' | 'document';

interface Contact {
    name: string;
    phone: string;
}

interface DispatchResult {
    phone: string;
    name: string;
    status: 'success' | 'error' | 'skipped';
    reason?: string;
}

interface MassDispatchProps {
    instance: any;           // objecto completo da instância
    onClose: () => void;
    instanceName?: string;   // compat backwards
}

// ── Helpers ───────────────────────────────────────────────────
function parseContacts(raw: string): Contact[] {
    return raw
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(line => {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 2) {
                const phone = parts[parts.length - 1].replace(/[^0-9]/g, '');
                const name = parts.slice(0, -1).join(' ');
                return { name, phone };
            }
            return { name: '', phone: parts[0].replace(/[^0-9]/g, '') };
        })
        .filter(c => c.phone.length >= 8);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function applyTemplate(text: string, name: string) {
    return text.replace(/\{\{nome\}\}/gi, name || 'Amigo(a)');
}

// ────────────────────────────────────────────────────────────────
export function MassDispatch({ instance, onClose, instanceName }: MassDispatchProps) {
    const instName = instance?.name || instanceName || '';
    const instanceId = instance?.id;

    // ── Form state ──────────────────────────────────────────────
    const [campaignName, setCampaignName] = useState('');
    const [mediaType, setMediaType] = useState<MediaType>('text');
    const [messages, setMessages] = useState<string[]>(['']);
    const [contactsRaw, setContactsRaw] = useState('');
    const [intervalBase, setIntervalBase] = useState(5);
    const [randomization, setRandomization] = useState(30);
    const [fileBase64, setFileBase64] = useState('');
    const [fileCaption, setFileCaption] = useState('');
    const [scheduleMode, setScheduleMode] = useState<'immediate' | 'scheduled'>('immediate');
    const [scheduledAt, setScheduledAt] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    // ── Dispatch state ──────────────────────────────────────────
    const [running, setRunning] = useState(false);

    // ── File upload ─────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setFileBase64(reader.result as string);
            toast.success(`Arquivo carregado: ${file.name}`);
        };
        reader.readAsDataURL(file);
    };

    // ── Importar TXT ────────────────────────────────────────────
    const handleImportTxt = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setContactsRaw(reader.result as string);
            reader.readAsText(file);
        };
        input.click();
    };

    // ── Iniciar disparo ─────────────────────────────────────────
    const startDispatch = useCallback(async () => {
        if (!instanceId) return toast.error('Instância inválida. Volte e tente novamente.');
        if (!campaignName.trim()) return toast.error('Dê um nome para a campanha.');

        const contacts = parseContacts(contactsRaw);
        if (contacts.length === 0) return toast.error('Adicione pelo menos um contato à lista.');

        const validMessages = messages.filter(m => m.trim());
        if (mediaType === 'text' && validMessages.length === 0) return toast.error('Adicione pelo menos uma mensagem.');
        if (mediaType !== 'text' && !fileBase64) return toast.error('Selecione um arquivo de mídia.');

        // ── Unificado: Tudo via Backend (Persistência) ────────────────
        try {
            setRunning(true);
            const headers = await getAuthHeader();

            let targetDate = scheduledAt;
            if (scheduleMode === 'immediate') {
                // Se for imediato, define como 'agora'
                targetDate = new Date().toISOString();
            } else {
                if (!scheduledAt) {
                    setRunning(false);
                    return toast.error('Selecione a data e hora para agendar.');
                }
                const targetTime = new Date(scheduledAt).getTime();
                if (targetTime <= Date.now()) {
                    setRunning(false);
                    return toast.error('A data/hora agendada já passou.');
                }
                targetDate = new Date(scheduledAt).toISOString();
            }

            const campaignData = {
                name: campaignName.trim(),
                instance_id: instanceId,
                scheduled_at: targetDate,
                contacts,
                messages: validMessages,
                media_type: mediaType,
                file_base64: fileBase64,
                file_caption: fileCaption,
                interval_base: intervalBase, // Corrigido de interval_base para intervalBase
                randomization,
                total_contacts: contacts.length
            };

            await axios.post(`${API}/campaigns`, campaignData, { headers });

            if (scheduleMode === 'immediate') {
                toast.success('🚀 Disparo iniciado! O servidor processará o envio em segundo plano.');
            } else {
                toast.success('🎉 Campanha agendada com sucesso! O servidor cuidará do envio.');
            }

            setRunning(false);
            onClose(); // Fecha o modal após enviar/agendar
        } catch (err: any) {
            setRunning(false);
            const msg = err.response?.data?.error || err.message;
            toast.error(`Falha ao iniciar disparo: ${msg}`);
        }
    }, [instanceId, campaignName, contactsRaw, messages, mediaType, fileBase64, fileCaption, intervalBase, randomization, scheduleMode, scheduledAt, onClose]);

    // ── Render ──────────────────────────────────────────────────
    const contacts = parseContacts(contactsRaw);

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
                onClick={onClose}
                className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Voltar para Conexões
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Formulário ── */}
                <div className="lg:col-span-3">
                    <Card className="shadow-2xl border-0 bg-white">
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Disparo em Massa</h2>
                                    {instName && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Conexão: <span className="font-semibold text-purple-700">{instName}</span>
                                        </p>
                                    )}
                                </div>
                            </div>


                            {/* Nome da Campanha */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Campanha <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Ex: Promoção de Março, Follow-up Clientes..."
                                    value={campaignName}
                                    onChange={e => setCampaignName(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    maxLength={80}
                                />
                            </div>

                            {/* Tipo de mídia */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Mídia</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {(['text', 'image', 'video', 'audio', 'document'] as MediaType[]).map(t => (
                                        <Button
                                            key={t}
                                            variant={mediaType === t ? 'default' : 'outline'}
                                            className={`text-xs font-semibold capitalize ${mediaType === t ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'hover:bg-purple-50 hover:border-purple-500'}`}
                                            onClick={() => setMediaType(t)}
                                        >
                                            {{ text: 'Texto', image: 'Imagem', video: 'Vídeo', audio: 'Áudio', document: 'Documento' }[t]}
                                        </Button>
                                    ))}
                                </div>
                            </div>


                            {/* Mensagens */}
                            {(mediaType === 'text' || mediaType !== 'audio') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {mediaType === 'text' ? 'Mensagens (alternadas)' : 'Legenda'}
                                        <span className="text-xs text-gray-400 ml-2 font-normal">Use {`{{nome}}`} para personalizar</span>
                                    </label>
                                    <div className="space-y-3">
                                        {messages.map((msg, i) => (
                                            <div key={i} className="flex gap-2">
                                                <textarea
                                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none outline-none text-sm"
                                                    rows={3}
                                                    placeholder={`Mensagem ${i + 1}: Olá {{nome}}, tudo bem?`}
                                                    value={msg}
                                                    onChange={e => {
                                                        const updated = [...messages];
                                                        updated[i] = e.target.value;
                                                        setMessages(updated);
                                                    }}
                                                />
                                                {messages.length > 1 && (
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="text-red-400 hover:text-red-600 self-start mt-1"
                                                        onClick={() => setMessages(messages.filter((_, j) => j !== i))}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {mediaType === 'text' && (
                                            <Button
                                                variant="outline" size="sm"
                                                className="w-full text-purple-600 hover:bg-purple-50 border-dashed h-10 font-semibold"
                                                onClick={() => setMessages([...messages, ''])}
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Adicionar mensagem alternada
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Arquivo de mídia */}
                            {mediaType !== 'text' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Arquivo {mediaType !== 'audio' ? '+ Legenda' : ''}
                                    </label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50/50 text-gray-500 hover:text-purple-600 font-semibold"
                                            onClick={() => fileRef.current?.click()}
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            {fileBase64 ? 'Arquivo carregado ✅' : 'Escolher arquivo'}
                                        </Button>
                                        {fileBase64 && (
                                            <Button variant="ghost" size="icon" className="text-red-400" onClick={() => setFileBase64('')}>
                                                <XCircle className="w-5 h-5" />
                                            </Button>
                                        )}
                                    </div>
                                    <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                                </div>
                            )}

                            {/* Lista de Contatos */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lista de Contatos</label>
                                <div className="flex gap-2 mb-2">
                                    <Button
                                        variant="outline" size="sm" className="flex-1 hover:bg-gray-50 font-semibold"
                                        onClick={() => navigator.clipboard.readText().then(t => setContactsRaw(p => p ? p + '\n' + t : t))}
                                    >
                                        📋 Colar
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 hover:bg-gray-50 font-semibold" onClick={handleImportTxt}>
                                        📁 Importar TXT
                                    </Button>
                                </div>
                                <div className="flex gap-2 mb-2">
                                    <div className="flex-1 text-center text-xs text-gray-500 border border-dashed rounded py-1">Formato: Nome, Número</div>
                                    <div className="flex-1 text-center text-xs text-gray-500 border border-dashed rounded py-1">Formato: Só Número</div>
                                </div>
                                <textarea
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm outline-none"
                                    rows={6}
                                    placeholder={`João Silva, 5511999999999\nMaria Santos, 5511888888888\nou apenas:\n5511777777777`}
                                    value={contactsRaw}
                                    onChange={e => setContactsRaw(e.target.value)}
                                />
                                {contacts.length > 0 && (
                                    <p className="text-xs text-purple-600 mt-1 font-medium">✓ {contacts.length} contatos detectados</p>
                                )}
                            </div>

                            {/* Timing */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo Base (segundos)</label>
                                    <input
                                        type="number" min="1" max="60"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                        value={intervalBase}
                                        onChange={e => setIntervalBase(Number(e.target.value))}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">⏱ Tempo fixo de espera entre cada envio</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Randomização (segundos)</label>
                                    <input
                                        type="number" min="0" max="30"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                        value={randomization}
                                        onChange={e => setRandomization(Number(e.target.value))}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">🎲 Intervalo aleatório entre envios (0-30s) para evitar bloqueios</p>
                                </div>
                            </div>

                            {/* Quando Enviar */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Quando Enviar</label>
                                <div className="space-y-2">
                                    <label
                                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${scheduleMode === 'immediate'
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => setScheduleMode('immediate')}
                                    >
                                        <input
                                            type="radio" className="mt-0.5 accent-purple-600"
                                            checked={scheduleMode === 'immediate'}
                                            onChange={() => setScheduleMode('immediate')}
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-gray-800">🚀 Iniciar imediatamente</div>
                                            <div className="text-xs text-gray-500">A campanha será executada assim que for criada</div>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${scheduleMode === 'scheduled'
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => setScheduleMode('scheduled')}
                                    >
                                        <input
                                            type="radio" className="mt-0.5 accent-purple-600"
                                            checked={scheduleMode === 'scheduled'}
                                            onChange={() => setScheduleMode('scheduled')}
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-gray-800">📅 Agendar para:</div>
                                            <div className="text-xs text-gray-500 mb-2">Escolha data e hora específicas</div>
                                            {scheduleMode === 'scheduled' && (
                                                <input
                                                    type="datetime-local"
                                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                                    value={scheduledAt}
                                                    onChange={e => setScheduledAt(e.target.value)}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Botões de ação */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                {!running ? (
                                    <Button
                                        className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold h-12 shadow-lg shadow-purple-200/50"
                                        onClick={startDispatch}
                                        disabled={contacts.length === 0}
                                    >
                                        <Send className="w-4 h-4 mr-2" /> Iniciar Disparo em Massa
                                    </Button>
                                ) : (
                                    <>
                                        <Button className="flex-1 h-12 font-bold bg-yellow-500 hover:bg-yellow-600" disabled>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...
                                        </Button>
                                    </>
                                )}
                                <Button variant="outline" className="w-32 h-12 font-semibold" onClick={onClose}>
                                    Cancelar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default MassDispatch;
