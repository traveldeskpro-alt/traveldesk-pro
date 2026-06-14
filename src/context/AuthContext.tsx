"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import { siteUrl } from "@/lib/siteUrl";

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

// Public interface — no demo-specific fields.
// Demo mode lives entirely inside /demo/* routes and DemoContext.
export interface AuthContextType {
  user: User | null;
  agency: Agency | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (form: SignupForm) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  agency: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  requestPasswordReset: async () => {},
  updatePassword: async () => {},
});

function setAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie =
      "tdp_auth_session=1; path=/; max-age=86400; SameSite=Lax";
  }
}

function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie =
      "tdp_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }
}

// Maps a Supabase users+agencies joined row into typed state objects.
function mapProfile(profile: any): { user: User; agency: Agency } | null {
  if (!profile?.agencies) return null;
  const a = profile.agencies as any;
  return {
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      agencyId: profile.agency_id,
    },
    agency: {
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      crNumber: a.cr_number || "",
      address: a.address || "",
      logoUrl: a.logo_url || "",
      currency: a.currency || "OMR",
      language: a.language || "en",
      status: a.status || "active",
      plan: a.plan || "starter",
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // No Supabase configured — nothing to initialise.
    // Production deployments must set NEXT_PUBLIC_SUPABASE_URL and
    // NEXT_PUBLIC_SUPABASE_ANON_KEY. Without them, auth will not work and
    // every login attempt will throw.
    if (!supabase) {
      if (mounted) setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    // onAuthStateChange is the single source of truth for auth state.
    //
    // Supabase v2 fires INITIAL_SESSION on mount with the currently stored
    // session (or null), replacing the need for a separate getSession() call.
    // Having both would create two concurrent async chains that race each other.
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          setUser(null);
          setAgency(null);
          clearAuthCookie();
          if (mounted) setIsLoading(false);
          return;
        }

        // Session refresh does not change the user profile.
        if (event === "TOKEN_REFRESHED") {
          if (mounted) setIsLoading(false);
          return;
        }

        if (!session) {
          // No session on initial load — user is not authenticated.
          // We do NOT check localStorage here. Demo mode is entirely isolated
          // to /demo/* routes and DemoContext; it never touches this provider.
          if (mounted) setIsLoading(false);
          return;
        }

        // INITIAL_SESSION | SIGNED_IN | USER_UPDATED with a valid session.
        const sb = supabase!;
        const res = await sb
          .from("users")
          .select("*, agencies(*)")
          .eq("id", session.user.id)
          .single();

        if (!res.data || res.error) {
          // Auth user exists but has no profile row — incomplete registration.
          // Sign out cleanly rather than leaving a half-authenticated state.
          await sb.auth.signOut();
          if (mounted) setIsLoading(false);
          return;
        }

        const mapped = mapProfile(res.data);
        if (mapped && mounted) {
          setUser(mapped.user);
          setAgency(mapped.agency);
          setAuthCookie();
        }
        if (mounted) setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // login — throws when Supabase is not configured.
  // Sets isLoading = true here; onAuthStateChange clears it after profile load
  // so AppShell never sees the transient isAuthenticated=false between the two.
  const login = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error(
        "Authentication is not configured. Please contact support."
      );
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    // State update and isLoading=false are handled by onAuthStateChange.
  }, []);

  // register — throws when Supabase is not configured.
  const register = useCallback(async (form: SignupForm) => {
    if (!supabase) {
      throw new Error(
        "Authentication is not configured. Please contact support."
      );
    }
    const sb = supabase;

    const { data: authData, error: authError } = await sb.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.agencyName },
        // Email-verification links must land on the canonical production
        // domain, never on the host that happened to issue the signup.
        emailRedirectTo: siteUrl("/dashboard"),
      },
    });
    if (authError) throw authError;
    const uid = authData.user!.id;

    const { data: agencyData, error: agencyError } = await sb
      .from("agencies")
      .insert({
        name: form.agencyName,
        email: form.email,
        phone: form.phone,
        cr_number: form.crNumber,
        address: form.address,
        currency: form.currency,
        language: form.language,
        status: "trial",
        plan: form.plan,
      })
      .select()
      .single();
    if (agencyError) throw agencyError;

    const { error: userError } = await sb.from("users").insert({
      id: uid,
      agency_id: agencyData.id,
      email: form.email,
      name: form.agencyName,
      role: "owner",
      active: true,
    });
    if (userError) throw userError;

    setIsLoading(true);
    const { error: signInError } = await sb.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (signInError) {
      setIsLoading(false);
      throw signInError;
    }
    // State update handled by onAuthStateChange SIGNED_IN.
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Authentication is not configured.");
    // Always send the reset link to the canonical production domain rather
    // than window.location.origin, which could be a preview host or localhost.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl("/reset-password"),
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) throw new Error("Authentication is not configured.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  const logout = useCallback(() => {
    if (supabase) {
      supabase.auth.signOut();
      // onAuthStateChange fires SIGNED_OUT and clears state.
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        agency,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
