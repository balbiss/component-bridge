import { supabase } from './supabase';

// Detecta se estamos em produção (servido pelo backend)
const isProd = import.meta.env.PROD;

// Se estiver em prod e não houver VITE_API_URL, usa o próprio domínio
const rawApiUrl = import.meta.env.VITE_API_URL || (isProd ? window.location.origin : 'http://localhost:3003');

// Garante que termina com /api sem redundância
export const API = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

export async function getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Sessão expirada. Faça login novamente.');
    return { Authorization: `Bearer ${session.access_token}` };
}
