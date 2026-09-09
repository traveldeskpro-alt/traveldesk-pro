"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useDarkMode } from "@/context/DarkModeContext";
import {
  LayoutDashboard,
  Ticket,
  Users,
  FileText,
  UserCheck,
  BarChart3,
  Calendar,
  Settings,
  ShieldCheck,
  LogOut,
  Globe,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Plane,
  AlertTriangle,
} from "lucide-react";

const navItems = (t: (k: string) => string) => [
  { label: t("commandCenter"), href: "/dashboard", icon: LayoutDashboard },
  { label: t("bookings"), href: "/bookings", icon: Ticket },
  { label: t("customers"), href: "/customers", icon: Users },
  { label: t("invoices"), href: "/invoices", icon: FileText },
  { label: t("agents"), href: "/agents", icon: UserCheck },
  { label: t("reports"), href: "/reports", icon: BarChart3 },
  { label: t("calendar"), href: "/calendar", icon: Calendar },
  { label: t("settings"), href: "/settings", icon: Settings },
  {
    label: t("admin"),
    href: "/saas-admin",
    icon: ShieldCheck,
    superAdminOnly: true,
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, agency, logout, isAuthenticated, isLoading } = useAuth();
  const { language, setLanguage, t, dir, isRTL } = useLanguage();
  const { isDark, toggleDark } = useDarkMode();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Public/authentication routes that should not be wrapped in the
  // authenticated TravelDesk workspace shell.
  //
  // /demo/* is a fully isolated demo workspace with its own DemoProvider
  // and DemoShell.
  //
  // /verify-otp is the authenticated MFA verification screen. It must be
  // accessible while the Supabase session is still at aal1.
  const isPublic =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-otp" ||
    pathname.startsWith("/demo");

  const isDashboard = !isPublic && isAuthenticated;

  const toggleLang = () => setLanguage(language === "en" ? "ar" : "en");

  // Do not redirect while auth state is still being resolved. isLoading stays
  // true between login() resolving and onAuthStateChange setting isAuthenticated,
  // so we must wait for it to clear before deciding to send the user away.
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublic) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, isPublic, router]);

  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      user?.role === "super_admin" &&
      pathname === "/dashboard"
    ) {
      router.replace("/saas-admin");
    }
  }, [isLoading, isAuthenticated, pathname, router, user?.role]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!isAuthenticated && !isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  const isSuspendedAgency =
    user?.role !== "super_admin" && agency?.status === "suspended";

  return (
    <div className="flex h-screen min-w-0 overflow-hidden bg-[var(--page-bg)] transition-colors duration-300">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[80] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 z-[90] h-screen shrink-0 bg-[var(--sidebar-bg)] border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 flex flex-col shadow-xl shadow-slate-900/10 lg:shadow-none ${
          isRTL
            ? "border-r-0 border-l border-slate-200/50 dark:border-slate-800/50 right-0"
            : "left-0"
        } ${
          mobileOpen
            ? "translate-x-0"
            : isRTL
              ? "translate-x-full lg:translate-x-0"
              : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-20" : "lg:w-72 w-80"}`}
      >
        <div className="shrink-0 flex items-center justify-between px-4 py-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className={`flex items-center gap-3 ${collapsed && "lg:hidden"}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-deep-blue flex items-center justify-center shadow-lg shadow-brand/30 overflow-hidden">
              <img
                src="/images/icon traveldesk.png"
                alt="TravelDesk Pro"
                className="w-7 h-7 object-contain"
              />
            </div>

            <div className="flex flex-col">
              <span className="font-bold text-navy dark:text-white tracking-tight text-sm leading-tight">
                TravelDesk
              </span>
              <span className="text-[10px] font-semibold text-brand-orange tracking-wider uppercase">
                Pro
              </span>
            </div>
          </div>

          <div className="lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden lg:block">
            <button
              type="button"
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              title={collapsed ? "Expand navigation" : "Collapse navigation"}
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
            >
              {collapsed ? (
                <Menu className="w-5 h-5" />
              ) : isRTL ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1">
          <div
            className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 ${
              collapsed && "lg:hidden"
            }`}
          >
            Workspace
          </div>

          {navItems(t)
            .filter(
              (item) =>
                !item.superAdminOnly || user?.role === "super_admin"
            )
            .map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[0.625rem] text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-navy dark:hover:text-white"
                  } ${collapsed && "lg:justify-center lg:px-2"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      isActive
                        ? "bg-brand text-white shadow-md shadow-brand/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  <span
                    className={`transition-opacity ${
                      collapsed && "lg:hidden"
                    }`}
                  >
                    {item.label}
                  </span>

                  {isActive && !collapsed && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full bg-brand-orange ${
                        "ms-auto"
                      }`}
                    />
                  )}
                </Link>
              );
            })}
        </nav>

        <div className="mt-auto shrink-0 px-4 pb-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-950/30 backdrop-blur">
          <div
            className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 ${
              collapsed && "lg:hidden"
            }`}
          >
            Preferences
          </div>

          <div className="space-y-1.5">
            <button
              onClick={toggleDark}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className={`flex items-center gap-3 px-3 py-2 w-full rounded-[0.625rem] text-sm font-medium transition-colors ${
                collapsed && "lg:justify-center lg:px-2"
              } ${
                isDark
                  ? "text-amber-400 hover:bg-amber-500/10"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {isDark ? (
                <Sun className="w-5 h-5 shrink-0" />
              ) : (
                <Moon className="w-5 h-5 shrink-0" />
              )}

              <span className={`${collapsed && "lg:hidden"}`}>
                {isDark ? "Light Mode" : "Dark Mode"}
              </span>
            </button>

            <button
              onClick={toggleLang}
              aria-label={
                language === "en" ? "Switch to Arabic" : "Switch to English"
              }
              className={`flex items-center gap-3 px-3 py-2 w-full rounded-[0.625rem] text-sm font-medium transition-colors ${
                collapsed && "lg:justify-center lg:px-2"
              } text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800`}
            >
              <Globe className="w-5 h-5 shrink-0" />

              <span className={`uppercase ${collapsed && "lg:hidden"}`}>
                {language === "en" ? "English" : "العربية"}
              </span>
            </button>

            <button
              onClick={logout}
              aria-label={t("logout")}
              className={`flex items-center gap-3 px-3 py-2 w-full rounded-[0.625rem] text-sm font-medium transition-colors ${
                collapsed && "lg:justify-center lg:px-2"
              } text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10`}
            >
              <LogOut className="w-5 h-5 shrink-0" />

              <span className={`${collapsed && "lg:hidden"}`}>
                {t("logout")}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 shrink-0 bg-[var(--sidebar-bg)] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <Plane className="w-4 h-4 text-brand/60" />

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString(
                  language === "ar" ? "ar-SA" : "en-GB",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange text-sm font-semibold text-white">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-navy dark:text-white leading-tight">
                {user?.name || "User"}
              </span>

              <span className="text-[10px] font-medium text-brand capitalize">
                {user?.role || "Viewer"}
              </span>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 min-h-0 overflow-x-hidden overflow-y-auto bg-[var(--page-bg)]">
          <div className="page-container">
            {isSuspendedAgency ? (
              <div className="min-h-full flex items-center justify-center">
                <div className="max-w-lg rounded-[0.625rem] border border-red-200 bg-white p-8 text-center shadow-surface dark:border-red-800/50 dark:bg-slate-900">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600">
                    <AlertTriangle className="h-7 w-7" />
                  </div>

                  <h1 className="text-2xl font-bold text-navy dark:text-white">
                    Subscription Suspended
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Your agency subscription is currently suspended. Please
                    contact TravelDesk Pro support to reactivate access.
                  </p>

                  <button
                    type="button"
                    onClick={logout}
                    className="mt-6 rounded-[0.625rem] bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}