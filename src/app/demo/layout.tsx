"use client";

// /demo layout — completely isolated from production auth and Supabase.
//
// Provider stack (inner-most wins for useAuth / useDataMode calls):
//   LanguageProvider
//   └─ DarkModeProvider
//      └─ DemoProvider       overrides AuthContext → demo user/agency
//         └─ DataModeProvider overrides DataModeContext → localStorage mode
//            └─ DemoShell    sidebar + header (no real-auth logic)
//               └─ {children}  production page components, unmodified

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DemoProvider, DEMO_AGENCY_ID } from "@/context/DemoContext";
import { DataModeProvider, DEMO_BOOKING_LIMIT } from "@/context/DataModeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { DarkModeProvider } from "@/context/DarkModeContext";
import {
  LayoutDashboard, Ticket, Users, FileText, UserCheck,
  BarChart3, Calendar, Settings, Menu, X, Plane, ExternalLink, Sparkles,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/demo/dashboard", icon: LayoutDashboard },
  { label: "Bookings",  href: "/demo/bookings",  icon: Ticket },
  { label: "Customers", href: "/demo/customers", icon: Users },
  { label: "Invoices",  href: "/demo/invoices",  icon: FileText },
  { label: "Agents",    href: "/demo/agents",    icon: UserCheck },
  { label: "Reports",   href: "/demo/reports",   icon: BarChart3 },
  { label: "Calendar",  href: "/demo/calendar",  icon: Calendar },
  { label: "Settings",  href: "/demo/settings",  icon: Settings },
];

// Reads the demo booking count from localStorage and re-reads it when
// useDataStore dispatches 'tdp-demo-data-change' after a create/delete.
function useDemoBookingCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const key = `tdp_bookings_${DEMO_AGENCY_ID}`;
    const read = () => {
      try {
        const raw = localStorage.getItem(key);
        setCount(raw ? (JSON.parse(raw) as unknown[]).length : 0);
      } catch {
        // Corrupted storage — ignore.
      }
    };

    read(); // initialise synchronously
    window.addEventListener("tdp-demo-data-change", read);
    return () => window.removeEventListener("tdp-demo-data-change", read);
  }, []);

  return count;
}

function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const bookingCount = useDemoBookingCount();
  const limitReached = bookingCount >= DEMO_BOOKING_LIMIT;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm leading-tight block">
                TravelDesk<span className="text-[#F97316]">Pro</span>
              </span>
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Demo
              </span>
            </div>
          </div>
          <button
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo banner */}
        <div
          className={`mx-3 mt-3 p-3 rounded-xl border ${
            limitReached
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className={`w-3.5 h-3.5 ${limitReached ? "text-red-500" : "text-amber-600"}`} />
            <span className={`text-xs font-semibold ${limitReached ? "text-red-800" : "text-amber-800"}`}>
              {limitReached ? "Demo limit reached" : "Demo Workspace"}
            </span>
          </div>
          <p className={`text-[11px] leading-tight ${limitReached ? "text-red-700" : "text-amber-700"}`}>
            {limitReached
              ? "Sign up for a free account to add unlimited bookings."
              : `Data is stored locally. Max ${DEMO_BOOKING_LIMIT} bookings.`}
          </p>
          {/* Progress bar */}
          <div className="mt-2 bg-amber-200/50 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all ${limitReached ? "bg-red-500" : "bg-amber-500"}`}
              style={{ width: `${Math.min((bookingCount / DEMO_BOOKING_LIMIT) * 100, 100)}%` }}
            />
          </div>
          <p className={`text-[10px] mt-1 ${limitReached ? "text-red-600" : "text-amber-600"}`}>
            {bookingCount}/{DEMO_BOOKING_LIMIT} bookings used
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#2563EB]/10 text-[#2563EB]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive
                      ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/30"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign up CTA */}
        <div className="p-4 border-t border-slate-100">
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] transition-colors shadow-lg shadow-blue-500/20"
          >
            <ExternalLink className="w-4 h-4" />
            Start Free Trial
          </Link>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            No credit card required
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <Plane className="w-4 h-4 text-[#2563EB]/60" />
            <span className="text-sm text-slate-500">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-orange-500/30">
              D
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-800">Demo User</span>
              <span className="text-[10px] font-medium text-[#2563EB]">owner</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <DarkModeProvider>
        <DemoProvider>
          <DataModeProvider>
            <DemoShell>{children}</DemoShell>
          </DataModeProvider>
        </DemoProvider>
      </DarkModeProvider>
    </LanguageProvider>
  );
}
