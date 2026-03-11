import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      // If we're in a popup and have a session, we're done – notify opener and close (hash may already be cleared by Supabase)
      if (typeof window !== 'undefined' && window.opener && session) {
        window.opener.postMessage({ type: 'SUPABASE_AUTH_COMPLETE' }, window.location.origin);
        window.close();
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase || typeof window === 'undefined') return;
    const redirectTo = window.location.href;
    // Open popup immediately (synchronously) so it's not blocked; we'll navigate it once we have the URL
    const width = 500;
    const height = 600;
    const left = Math.round((window.screen.width - width) / 2);
    const top = Math.round((window.screen.height - height) / 2);
    const popup = window.open(
      'about:blank',
      'supabase-google-auth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
    if (!popup) {
      // Popup blocked – fall back to redirect in same tab (no skipBrowserRedirect so SDK will redirect)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (!error && data?.url) window.location.href = data.url;
      return;
    }
    // skipBrowserRedirect: true so only the popup navigates; main tab stays put
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) {
      console.error('Google sign-in error:', error);
      popup.close();
      return;
    }
    if (!data?.url) {
      popup.close();
      return;
    }
    popup.location.href = data.url;
    return new Promise<void>((resolve) => {
      const onMessage = (e: MessageEvent) => {
        if (e.origin !== window.location.origin || e.data?.type !== 'SUPABASE_AUTH_COMPLETE') return;
        window.removeEventListener('message', onMessage);
        clearInterval(interval);
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          setSession(s);
          setUser(s?.user ?? null);
        });
        resolve();
      };
      const onClose = () => {
        clearInterval(interval);
        window.removeEventListener('message', onMessage);
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          setSession(s);
          setUser(s?.user ?? null);
        });
        resolve();
      };
      window.addEventListener('message', onMessage);
      const interval = setInterval(() => {
        if (popup.closed) {
          onClose();
        }
      }, 200);
    });
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!supabase) return { error: new Error('Auth not configured') };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ?? null };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!supabase) return { error: new Error('Auth not configured') };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    // Update UI immediately so sign-out feels instant; then clear session in Supabase
    setSession(null);
    setUser(null);
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        signOut,
        isConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

/** Optional hook: returns auth context or null if outside provider. */
export function useAuthOptional(): AuthContextType | null {
  return useContext(AuthContext) ?? null;
}
