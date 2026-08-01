import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function loadCompany(currentUser) {
    // Deadlock warning (Supabase docs, real bug hit and fixed in WA Filter
    // 2026-08-01): never call another Supabase method synchronously inside
    // onAuthStateChange - signInWithPassword holds the client's internal
    // lock while notifying listeners. This function is only ever called
    // from a plain useEffect keyed on `user`, never from inside the
    // listener callback itself, to avoid that exact deadlock.
    const { data, error } = await supabase
      .from('company_members')
      .select('role, companies(*)')
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn('[Auth] Failed to load company:', error.message);
      return null;
    }
    if (data) return { ...data.companies, role: data.role };

    // No company yet. If email confirmation is on, there's no session at
    // signup time to create it then - the company name was stashed in
    // user metadata instead, and this is where it actually gets created,
    // the first time this user has a real authenticated session
    // regardless of whether that's immediately (confirmation off) or
    // later (confirmation on, after they click the email link and log in).
    const pendingName = currentUser?.user_metadata?.pending_company_name;
    if (!pendingName) return null;

    const { error: createError } = await supabase.rpc('create_company_and_join', {
      p_name: pendingName,
      p_email: currentUser.email,
    });
    if (createError) {
      console.warn('[Auth] Failed to create pending company:', createError.message);
      return null;
    }
    const { data: retry } = await supabase
      .from('company_members')
      .select('role, companies(*)')
      .limit(1)
      .maybeSingle();
    return retry ? { ...retry.companies, role: retry.role } : null;
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setCompany(null);
      return;
    }
    let cancelled = false;
    loadCompany(user).then((c) => {
      if (!cancelled) setCompany(c);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email, password, companyName) => {
    // Company name travels as metadata, not created here directly - if
    // Supabase requires email confirmation there is no active session yet
    // to create it with (auth.uid() would be null). loadCompany() creates
    // the real company from this metadata the first time the user has an
    // actual session, whenever that is.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { pending_company_name: companyName } },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCompany(null);
    setIsAuthenticated(false);
  };

  const refreshCompany = async () => {
    const c = await loadCompany(user);
    setCompany(c);
    return c;
  };

  return (
    <AuthContext.Provider value={{ user, company, isAuthenticated, isLoading, login, signup, logout, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
