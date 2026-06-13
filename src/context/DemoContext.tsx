"use client";

// DemoContext — provides AuthContext values for /demo/* routes.
//
// DemoProvider overrides the outer AuthContext (provided by the root layout's
// AuthProvider) using React's nearest-ancestor provider rule. Any component
// inside /demo/* that calls useAuth() receives demo values, never touching
// Supabase auth.
//
// Demo booking limit enforcement lives in useDataStore.useBookings.create.
// The DemoShell sidebar reads the booking count directly from localStorage
// and listens for the 'tdp-demo-data-change' custom event dispatched by the
// data layer after each write.

import React from "react";
import { AuthContext, type AuthContextType } from "./AuthContext";

export const DEMO_AGENCY_ID = "demo-agency";

const DEMO_USER: NonNullable<AuthContextType["user"]> = {
  id: "demo-user-001",
  name: "Demo User",
  email: "demo@traveldeskpro.app",
  role: "owner",
  agencyId: DEMO_AGENCY_ID,
};

const DEMO_AGENCY: NonNullable<AuthContextType["agency"]> = {
  id: DEMO_AGENCY_ID,
  name: "Demo Travel Agency",
  email: "demo@traveldeskpro.app",
  phone: "+968 9000 0000",
  crNumber: "CR-DEMO-001",
  address: "Muscat, Oman",
  currency: "OMR",
  language: "en",
  status: "active",
  plan: "professional",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const demoAuthValue: AuthContextType = {
  user: DEMO_USER,
  agency: DEMO_AGENCY,
  isAuthenticated: true,
  isLoading: false,
  login: async () => {
    throw new Error("Use the real login page for authenticated access.");
  },
  register: async () => {
    throw new Error("Registration is not available in demo mode.");
  },
  logout: () => {
    if (typeof window !== "undefined") window.location.href = "/login";
  },
  requestPasswordReset: async () => {
    throw new Error("Password reset is not available in demo mode.");
  },
  updatePassword: async () => {
    throw new Error("Password update is not available in demo mode.");
  },
};

export function DemoProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={demoAuthValue}>
      {children}
    </AuthContext.Provider>
  );
}
