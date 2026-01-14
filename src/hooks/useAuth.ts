import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  alpaca_api_key_encrypted: string | null;
  alpaca_secret_key_encrypted: string | null;
  alpaca_paper_trading: boolean;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid blocking
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setProfile(null);
    }
    return { error };
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'display_name' | 'alpaca_paper_trading'>>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
    
    return { data, error };
  };

  // Save Alpaca credentials via secure edge function (encrypted server-side)
  const saveAlpacaCredentials = async (apiKey: string, secretKey: string, paperTrading: boolean) => {
    if (!session?.access_token) {
      return { error: new Error('Not authenticated') };
    }

    try {
      const { data, error } = await supabase.functions.invoke('save-alpaca-keys', {
        body: {
          alpaca_api_key: apiKey,
          alpaca_secret_key: secretKey,
          alpaca_paper_trading: paperTrading,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Refetch profile to update local state
      if (user) {
        await fetchProfile(user.id);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to save Alpaca credentials:', error);
      return { error };
    }
  };

  const hasAlpacaCredentials = Boolean(
    profile?.alpaca_api_key_encrypted && profile?.alpaca_secret_key_encrypted
  );

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    saveAlpacaCredentials,
    hasAlpacaCredentials,
    refetchProfile: () => user && fetchProfile(user.id),
  };
};
