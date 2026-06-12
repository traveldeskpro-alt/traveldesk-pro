"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  agencyId: string;
  avatar?: string;
}

interface Agency {
  id: string;
  name: string;
  email: string;
  phone: string;
  crNumber: string;
  address: string;
  logoUrl?: string;
  currency: string;
  language: string;
  status: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

interface SignupForm {
  agencyName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  crNumber: string;
  currency: string;
  language: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  agency: Agency | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemo: boolean;
  demoBookingCount: number;
  login: (email: string, password: string) => Promise<void>;
  register: (form: SignupForm) => Promise<void>;
  startDemo: () => Promise<void>;
  logout: () => void;
  canCreateBooking: () => boolean;
  incrementDemoBooking: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  agency: null,
  isAuthenticated: false,
  isLoading: true,
  isDemo: false,
  demoBookingCount: 0,
  login: async () => {},
  register: async () => {},
  startDemo: async () => {},
  logout: () => {},
  canCreateBooking: () => false,
  incrementDemoBooking: () => {},
});

function setAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "tdp_auth_session=1; path=/; max-age=86400; SameSite=Lax";
  }
}

function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "tdp_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }
}

const mockAgency: Agency = {
  id: "agency-001",
  name: "TravelDesk Pro Demo",
  email: "demo@traveldeskpro.app",
  phone: "+968 9000 0000",
  crNumber: "CR-123456",
  address: "Muscat, Oman",
  currency: "OMR",
  language: "en",
  status: "active",
  plan: "professional",
  createdAt: "2024-01-01",
  updatedAt: "2024-06-10",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [demoBookingCount, setDemoBookingCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const sb = supabase;
      if (sb) {
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user && mounted) {
          const res = await sb
            .from('users')
            .select('*, agencies(*)')
            .eq('id', session.user.id)
            .single();
          const profile = res.data as any;
          if (profile && mounted) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              agencyId: profile.agency_id,
            });
            const a = profile.agencies as any;
            setAgency({
              id: a.id,
              name: a.name,
              email: a.email,
              phone: a.phone,
              crNumber: a.cr_number || '',
              address: a.address || '',
              logoUrl: a.logo_url || '',
              currency: a.currency || 'OMR',
              language: a.language || 'en',
              status: a.status || 'active',
              plan: a.plan || 'starter',
              createdAt: a.created_at,
              updatedAt: a.updated_at,
            });
          }
        }
      } else {
        const stored = typeof window !== "undefined" ? localStorage.getItem("tdp_user") : null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (mounted) {
              setUser(parsed.user);
              setAgency(parsed.agency || mockAgency);
              setIsDemo(parsed.isDemo || false);
              setDemoBookingCount(parsed.demoBookingCount || 0);
            }
          } catch {
            // ignore
          }
        }
      }
      if (mounted) setIsLoading(false);
    }

    loadSession();

    if (supabase) {
      const sb = supabase;
      const { data: listener } = sb.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setAgency(null);
          setIsDemo(false);
          clearAuthCookie();
          return;
        }
        if (session?.user) {
          const res = await sb
            .from('users')
            .select('*, agencies(*)')
            .eq('id', session.user.id)
            .single();
          const profile = res.data as any;
          if (profile && mounted) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              agencyId: profile.agency_id,
            });
            const a = profile.agencies as any;
            setAgency({
              id: a.id,
              name: a.name,
              email: a.email,
              phone: a.phone,
              crNumber: a.cr_number || '',
              address: a.address || '',
              logoUrl: a.logo_url || '',
              currency: a.currency || 'OMR',
              language: a.language || 'en',
              status: a.status || 'active',
              plan: a.plan || 'starter',
              createdAt: a.created_at,
              updatedAt: a.updated_at,
            });
          }
        }
      });
      return () => {
        mounted = false;
        listener?.subscription.unsubscribe();
      };
    }

    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const sb = supabase;
    if (sb) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        const res = await sb
          .from('users')
          .select('*, agencies(*)')
          .eq('id', data.user.id)
          .single();
        const profile = res.data as any;
        if (profile) {
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            agencyId: profile.agency_id,
          });
          const a = profile.agencies as any;
          setAgency({
            id: a.id,
            name: a.name,
            email: a.email,
            phone: a.phone,
            crNumber: a.cr_number || '',
            address: a.address || '',
            logoUrl: a.logo_url || '',
            currency: a.currency || 'OMR',
            language: a.language || 'en',
            status: a.status || 'active',
            plan: a.plan || 'starter',
            createdAt: a.created_at,
            updatedAt: a.updated_at,
          });
          setIsDemo(false);
        }
      }
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    const newUser: User = {
      id: "usr-001",
      name: "John Doe",
      email,
      role: "owner",
      agencyId: "agency-001",
    };
    setUser(newUser);
    setAgency(mockAgency);
    setIsDemo(false);
    setDemoBookingCount(0);
    setAuthCookie();
    if (typeof window !== "undefined") {
      localStorage.setItem("tdp_user", JSON.stringify({ user: newUser, agency: mockAgency, isDemo: false, demoBookingCount: 0 }));
    }
  }, []);

  const startDemo = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const demoUser: User = {
      id: "demo-001",
      name: "Demo User",
      email: "demo@traveldeskpro.app",
      role: "owner",
      agencyId: "demo-agency",
    };
    const demoAgency: Agency = { ...mockAgency, id: "demo-agency", name: "Demo Travel Agency", email: "demo@traveldeskpro.app" };
    setUser(demoUser);
    setAgency(demoAgency);
    setIsDemo(true);
    setDemoBookingCount(0);
    setAuthCookie();
    if (typeof window !== "undefined") {
      localStorage.setItem("tdp_user", JSON.stringify({ user: demoUser, agency: demoAgency, isDemo: true, demoBookingCount: 0 }));
    }
  }, []);

  const register = useCallback(async (form: SignupForm) => {
    const sb = supabase;
    if (sb) {
      const { data: authData, error: authError } = await sb.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.agencyName } },
      });
      if (authError) throw authError;
      const uid = authData.user!.id;

      const { data: agencyData, error: agencyError } = await sb.from('agencies').insert({
        name: form.agencyName,
        email: form.email,
        phone: form.phone,
        cr_number: form.crNumber,
        address: form.address,
        currency: form.currency,
        language: form.language,
        status: 'trial',
        plan: form.plan,
      }).select().single();
      if (agencyError) throw agencyError;

      await sb.from('users').insert({
        id: uid,
        agency_id: agencyData.id,
        email: form.email,
        name: form.agencyName,
        role: 'owner',
        active: true,
      });

      const { data: signInData, error: signInError } = await sb.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (!signInError && signInData.user) {
        const a = agencyData as any;
        setUser({ id: uid, name: form.agencyName, email: form.email, role: 'owner', agencyId: agencyData.id });
        setAgency({
          id: a.id,
          name: a.name,
          email: a.email,
          phone: a.phone,
          crNumber: a.cr_number || '',
          address: a.address || '',
          logoUrl: a.logo_url || '',
          currency: a.currency || 'OMR',
          language: a.language || 'en',
          status: a.status || 'trial',
          plan: a.plan || 'starter',
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        });
      }
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
    const newUser: User = {
      id: "usr-" + Math.random().toString(36).substring(2, 8),
      name: form.agencyName,
      email: form.email,
      role: "owner",
      agencyId: "agency-" + Math.random().toString(36).substring(2, 8),
    };
    const newAgency: Agency = {
      ...mockAgency,
      id: newUser.agencyId,
      name: form.agencyName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      crNumber: form.crNumber,
      currency: form.currency,
      language: form.language,
      plan: form.plan,
      status: 'trial',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUser(newUser);
    setAgency(newAgency);
    setIsDemo(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("tdp_user", JSON.stringify({ user: newUser, agency: newAgency, isDemo: false, demoBookingCount: 0 }));
    }
  }, []);

  const logout = useCallback(() => {
    const sb = supabase;
    if (sb) {
      sb.auth.signOut();
    }
    setUser(null);
    setAgency(null);
    setIsDemo(false);
    setDemoBookingCount(0);
    clearAuthCookie();
    if (typeof window !== "undefined") {
      localStorage.removeItem("tdp_user");
    }
  }, []);

  const canCreateBooking = useCallback(() => {
    if (!isDemo) return true;
    return demoBookingCount < 2;
  }, [isDemo, demoBookingCount]);

  const incrementDemoBooking = useCallback(() => {
    if (isDemo) {
      setDemoBookingCount((prev) => {
        const next = prev + 1;
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("tdp_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.demoBookingCount = next;
            localStorage.setItem("tdp_user", JSON.stringify(parsed));
          }
        }
        return next;
      });
    }
  }, [isDemo]);

  return (
    <AuthContext.Provider
      value={{
        user,
        agency,
        isAuthenticated: !!user,
        isLoading,
        isDemo,
        demoBookingCount,
        login,
        register,
        startDemo,
        logout,
        canCreateBooking,
        incrementDemoBooking,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
