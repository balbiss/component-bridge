import { supabase } from './supabase';

export const API = 'http://localhost:3002/api';

export async function getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Sessão expirada. Faça login novamente.');
    return { Authorization: `Bearer ${session.access_token}` };
}
