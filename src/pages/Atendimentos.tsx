import React, { useState, useEffect } from 'react';
import {
    Search,
    MoreVertical,
    Send,
    Plus,
    User,
    CheckCheck,
    Phone,
    Video,
    Image as ImageIcon,
    Paperclip,
    Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';

const Atendimentos = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');

    // Mock de conversas para visualização
    const chats = [
        { id: 1, name: 'Anderson Balbis', lastMsg: 'Olá, gostaria de saber mais sobre...', time: '10:30', unread: 2, status: 'online' },
        { id: 2, name: 'Maria Silva', lastMsg: 'O pagamento já foi confirmado?', time: '09:45', unread: 0, status: 'offline' },
        { id: 3, name: 'João Pereira', lastMsg: 'Obrigado!', time: 'Ontem', unread: 0, status: 'online' },
    ];

    const messages = [
        { id: 1, text: 'Olá! Como posso te ajudar?', sender: 'me', time: '10:25' },
        { id: 2, text: 'Gostaria de saber mais sobre os planos de automação.', sender: 'them', time: '10:30' },
    ];

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Lista de Conversas */}
                <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/30">
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Conversas</h2>
                            <Button size="icon" variant="ghost" className="rounded-full">
                                <Plus className="w-5 h-5 text-gray-500" />
                            </Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input placeholder="Buscar contatos..." className="pl-9 bg-white border-gray-200" />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        {chats.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-l-4 ${selectedChat?.id === chat.id
                                        ? 'bg-purple-50 border-purple-600'
                                        : 'hover:bg-gray-100/50 border-transparent'
                                    }`}
                            >
                                <div className="relative">
                                    <Avatar>
                                        <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">{chat.name[0]}</AvatarFallback>
                                    </Avatar>
                                    {chat.status === 'online' && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-gray-900 truncate">{chat.name}</span>
                                        <span className="text-xs text-gray-500">{chat.time}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-500 truncate">{chat.lastMsg}</p>
                                        {chat.unread > 0 && (
                                            <Badge className="bg-purple-600 hover:bg-purple-700 rounded-full h-5 w-5 flex items-center justify-center p-0">
                                                {chat.unread}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                </div>

                {/* Área de Chat */}
                {selectedChat ? (
                    <div className="flex-1 flex flex-col bg-white">
                        {/* Header do Chat */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">{selectedChat.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{selectedChat.name}</h3>
                                    <p className="text-xs text-green-600 font-medium">Online</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost"><Phone className="w-5 h-5 text-gray-400" /></Button>
                                <Button size="icon" variant="ghost"><Video className="w-5 h-5 text-gray-400" /></Button>
                                <Separator orientation="vertical" className="h-6 mx-2" />
                                <Button size="icon" variant="ghost"><MoreVertical className="w-5 h-5 text-gray-400" /></Button>
                            </div>
                        </div>

                        {/* Mensagens */}
                        <ScrollArea className="flex-1 p-6 bg-[#f0f2f5] bg-[url('https://wweb.dev/assets/whatsapp-chat-back.png')] bg-repeat">
                            <div className="space-y-4 max-w-4xl mx-auto">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-xl shadow-sm relative ${msg.sender === 'me'
                                                ? 'bg-purple-600 text-white rounded-tr-none'
                                                : 'bg-white text-gray-900 rounded-tl-none'
                                            }`}>
                                            <p className="text-sm pr-12">{msg.text}</p>
                                            <span className={`text-[10px] absolute bottom-1 right-2 flex items-center gap-1 ${msg.sender === 'me' ? 'text-purple-200' : 'text-gray-400'
                                                }`}>
                                                {msg.time}
                                                {msg.sender === 'me' && <CheckCheck className="w-3 h-3" />}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Input de Mensagem */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                            <div className="max-w-4xl mx-auto flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="rounded-full"><Smile className="w-5 h-5 text-gray-500" /></Button>
                                    <Button size="icon" variant="ghost" className="rounded-full"><Paperclip className="w-5 h-5 text-gray-500" /></Button>
                                    <Button size="icon" variant="ghost" className="rounded-full"><ImageIcon className="w-5 h-5 text-gray-500" /></Button>
                                </div>
                                <div className="flex-1 relative">
                                    <Input
                                        placeholder="Digite sua mensagem..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="bg-white border-gray-200 pr-4 h-11 rounded-full shadow-sm"
                                    />
                                </div>
                                <Button
                                    disabled={!message.trim()}
                                    className="bg-purple-600 hover:bg-purple-700 h-11 w-11 p-0 rounded-full shrink-0 shadow-lg transition-all active:scale-95"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50/30">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                                <User className="w-8 h-8 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Selecione uma conversa</h3>
                                <p className="text-gray-500 max-w-xs mx-auto">Inicie um atendimento selecionando um contato na lista ao lado.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Atendimentos;
