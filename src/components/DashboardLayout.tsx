import React, { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import {
    Menu,
    X,
    Bell,
    Search,
    ChevronDown
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { user } = useAuth();
    const [currentTime] = useState(new Date());

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-gray-50/50">
                <DashboardSidebar />

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <header className="h-14 flex items-center justify-between border-b border-gray-200 px-5 bg-white shrink-0 sticky top-0 z-10 shadow-sm">
                        <div className="flex items-center gap-4">
                            <h1 className="text-gray-900 font-bold text-lg tracking-tight">Dashboard</h1>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Search bar (desktop) */}
                            <div className="hidden md:flex relative w-56">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar..."
                                    className="w-full bg-gray-100 border-none rounded-full py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <button className="relative p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all">
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                                </button>

                                <div className="flex items-center gap-3 pl-2 border-l border-gray-100">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-semibold text-gray-900 leading-none mb-1">{user?.email?.split('@')[0] || 'Usuário'}</p>
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 text-[10px] h-4 uppercase font-bold px-1.5">Plano Pro</Badge>
                                    </div>
                                    <Avatar className="w-9 h-9 border-2 border-white shadow-sm ring-1 ring-gray-100">
                                        <AvatarFallback className="bg-purple-600/10 text-purple-700 text-xs font-bold uppercase">
                                            {user?.email?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <ChevronDown className="w-4 h-4 text-gray-300 hidden sm:block" />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 p-5 overflow-y-auto">
                        <div className="max-w-[1600px] mx-auto h-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};

export default DashboardLayout;
