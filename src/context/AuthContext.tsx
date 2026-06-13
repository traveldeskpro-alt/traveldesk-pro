"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
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
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
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

// Reusable helper — maps a Supabase users+agencies row into typed state.
function mapProfile(
  profile: any
): { user: User; agency: Agency } | null {
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
  const [isDemo, setIsDemo] = useState(false);
  const [demoBookingCount, setDemoBookingCount] = useState(0);

  // Ref used inside onAuthStateChange closure to detect active demo sessions
  // without capturing stale state (avoids stale closure bugs).
  const isDemoRef = useRef(false);

  useEffect(() => {
    isDemoRef.current = isDemo;
  }, [isDemo]);

  useEffect(() => {
    let mounted = true;

    // ── Supabase not configured ────────────────────────────────────────────
    // No real auth available. Load persisted demo session from localStorage if
    // present so the "Explore Demo" experience survives a page refresh.
    if (!supabase) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("tdp_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.isDemo && mounted) {
              setUser(parsed.user);
              setAgency(parsed.agency || mockAgency);
              setIsDemo(true);
              isDemoRef.current = true;
              setDemoBookingCount(parsed.demoBookingCount || 0);
            }
          } catch {
            // Corrupted storage — ignore.
          }
        }
      }
      if (mounted) setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    // ── Supabase is available ───────────────────────────────────────────────
    // Use onAuthStateChange as the SINGLE source of truth for auth state.
    //
    // In Supabase v2 the listener fires INITIAL_SESSION on mount with the
    // currently stored session (or null). This replaces getSession() and
    // eliminates the race condition that existed when both ran concurrently.
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // ── Signed out ─────────────────────────────────────────────────────
        if (event === "SIGNED_OUT") {
          setUser(null);
          setAgency(null);
          setIsDemo(false);
          isDemoRef.current = false;
          setDemoBookingCount(0);
          clearAuthCookie();
          if (mounted) setIsLoading(false);
          return;
        }

        // ── Token refreshed — session updated but profile unchanged ────────
        if (event === "TOKEN_REFRESHED") {
          if (mounted) setIsLoading(false);
          return;
        }

        // ── No session (initial load without auth) ─────────────────────────
        if (!session) {
          // Check whether the user entered demo mode before this event fired.
          // If so, leave the demo state intact.
          if (!isDemoRef.current && typeof window !== "undefined") {
            const stored = localStorage.getItem("tdp_user");
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed.isDemo && mounted) {
                  setUser(parsed.user);
                  setAgency(parsed.agency || mockAgency);
                  setIsDemo(true);
                  isDemoRef.current = true;
                  setDemoBookingCount(parsed.demoBookingCount || 0);
                  if (mounted) setIsLoading(false);
                  return;
                }
              } catch {
                // Corrupted storage — ignore.
              }
            }
          }
          if (mounted) setIsLoading(false);
          return;
        }

        // ── Valid session (INITIAL_SESSION, SIGNED_IN, USER_UPDATED) ──────
        // supabase is guaranteed non-null here: the outer useEffect returns
        // early when supabase is null and onAuthStateChange is never called.
        const sb = supabase!;
        const res = await sb
          .from("users")
          .select("*, agencies(*)")
          .eq("id", session.user.id)
          .single();

        if (!res.data || res.error) {
          // Auth user exists but has no matching profile row.
          // Sign out cleanly rather than leaving a half-authenticated state.
          await sb.auth.signOut();
          if (mounted) setIsLoading(false);
          return;
        }

        const mapped = mapProfile(res.data);
        if (mapped && mounted) {
          setUser(mapped.user);
          setAgency(mapped.agency);
          setIsDemo(false);
          isDemoRef.current = false;
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

  // ── login ──────────────────────────────────────────────────────────────────
  // Throws when Supabase is not configured instead of silently accepting any
  // credentials. isLoading is set to true here and cleared by onAuthStateChange
  // so AppShell shows a spinner between login() resolving and SIGNED_IN firing.
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
    // Profile loading and isLoading = false are handled by onAuthStateChange.
  }, []);

  // ── startDemo ──────────────────────────────────────────────────────────────
  // Purely client-side demo mode. Not real authentication — no Supabase session
  // is created. State is persisted to localStorage so the demo survives a
  // refresh, but on reload it is loaded by the onAuthStateChange null-session
  // branch above (not by Supabase).
  const startDemo = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const demoUser: User = {
      id: "demo-001",
      name: "Demo User",
      email: "demo@traveldeskpro.app",
      role: "owner",
      agencyId: "demo-agency",
    };
    const demoAgency: Agency = {
      ...mockAgency,
      id: "demo-agency",
      name: "Demo Travel Agency",
      email: "demo@traveldeskpro.app",
    };
    setUser(demoUser);
    setAgency(demoAgency);
    setIsDemo(true);
    isDemoRef.current = true;
    setDemoBookingCount(0);
    setAuthCookie();
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "tdp_user",
        JSON.stringify({
          user: demoUser,
          agency: demoAgency,
          isDemo: true,
          demoBookingCount: 0,
        })
      );
    }
  }, []);

  // ── register ───────────────────────────────────────────────────────────────
  // Throws when Supabase is not configured. The localStorage fallback that
  // previously created a fake local account is removed.
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
      options: { data: { name: form.agencyName } },
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

    // Sign in triggers onAuthStateChange → SIGNED_IN → profile load.
    setIsLoading(true);
    const { error: signInError } = await sb.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (signInError) {
      setIsLoading(false);
      throw signInError;
    }
    // State update handled by onAuthStateChange.
  }, []);

  // ── requestPasswordReset ──────────────────────────────────────────────────
  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) {
      throw new Error("Authentication is not configured.");
    }
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  }, []);

  // ── updatePassword ────────────────────────────────────────────────────────
  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) {
      throw new Error("Authentication is not configured.");
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (supabase) {
      supabase.auth.signOut();
      // onAuthStateChange handles SIGNED_OUT → clears state.
    } else {
      // No Supabase (demo-only mode) — clear manually.
      setUser(null);
      setAgency(null);
      setIsDemo(false);
      isDemoRef.current = false;
      setDemoBookingCount(0);
      clearAuthCookie();
      if (typeof window !== "undefined") {
        localStorage.removeItem("tdp_user");
      }
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
            try {
              const parsed = JSON.parse(stored);
              parsed.demoBookingCount = next;
              localStorage.setItem("tdp_user", JSON.stringify(parsed));
            } catch {
              // ignore
            }
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
