import { supabase } from './supabase';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';
export const API = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

export async function getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Sessão expirada. Faça login novamente.');
    return { Authorization: `Bearer ${session.access_token}` };
}
