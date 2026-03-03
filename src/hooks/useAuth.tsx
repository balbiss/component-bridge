import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: any | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const fetchedUserId = useRef<string | null>(null);

    useEffect(() => {
        let mounted = true;

        // Listen for changes on auth state (this also triggers on initial load)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // console.log('Auth state change:', event);

            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    if (fetchedUserId.current !== session.user.id) {
                        await fetchProfile(session.user.id);
                    }
                } else {
                    fetchedUserId.current = null;
                    setProfile(null);
                    setLoading(false);
                }
            }
        });

        // Check session once manually just in case the initial event doesn't fire as expected
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted && !user && session?.user) {
                setSession(session);
                setUser(session.user);
                if (fetchedUserId.current !== session.user.id) {
                    fetchProfile(session.user.id);
                }
            } else if (mounted && !session?.user) {
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        // console.log('Fetching profile for user:', userId);
        fetchedUserId.current = userId; // Mark as fetching/fetched
        let timeoutId: NodeJS.Timeout;
        try {
            // Set a longer timeout for profile (15s) to avoid race conditions on slow connections
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('Profile fetch timeout (15s)')), 15000);
            });

            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
            clearTimeout(timeoutId!);

            if (data) {
                // console.log('Profile fetched successfully');
                setProfile(data);
            } else {
                console.log('Profile non-existent or fetch error');
            }
        } catch (error) {
            console.error('Error in fetchProfile:', error);
        } finally {
            // Always stop loading, even if profile fails
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        profile,
        loading,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
