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
  { label: t("admin"), href: "/admin", icon: ShieldCheck, superAdminOnly: true },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { language, setLanguage, t, dir, isRTL } = useLanguage();
  const { isDark, toggleDark } = useDarkMode();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // /demo/* is a fully isolated demo workspace with its own DemoProvider and
  // DemoShell. Treat it as public so AppShell does not wrap it in the real
  // authenticated sidebar or perform any session-based redirect.
  const isPublic =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
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

  return (
    <div className="min-h-screen flex bg-[var(--page-bg)] transition-colors duration-300">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 z-50 bg-[var(--sidebar-bg)] border-r border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 flex flex-col ${
          isRTL ? "border-r-0 border-l border-slate-200/50 dark:border-slate-800/50 right-0" : "left-0"
        } ${
          mobileOpen
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full lg:translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-20" : "lg:w-72 w-80"}`}
      >
        <div className="flex items-center justify-between h-18 px-4 py-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className={`flex items-center gap-3 ${collapsed && "lg:hidden"}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-deep-blue flex items-center justify-center shadow-lg shadow-brand/30 overflow-hidden">
              <img 
                src="/images/icon traveldesk.png" 
                alt="TravelDesk Pro" 
                className="w-7 h-7 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-navy dark:text-white tracking-tight text-sm leading-tight">TravelDesk</span>
              <span className="text-[10px] font-semibold text-brand-orange tracking-wider uppercase">Pro</span>
            </div>
          </div>
          <div className="lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="hidden lg:block">
            <button
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

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems(t).filter((item) => !item.superAdminOnly || user?.role === "super_admin").map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-navy dark:hover:text-white"
                } ${collapsed && "lg:justify-center lg:px-2"}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isActive 
                    ? "bg-brand text-white shadow-md shadow-brand/30" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className={`transition-opacity ${collapsed && "lg:hidden"}`}>
                  {item.label}
                </span>
                {isActive && !collapsed && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full bg-brand-orange ${
                      isRTL ? "mr-auto" : "ml-auto"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-2">
          <button
            onClick={toggleDark}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium transition-colors ${
              collapsed && "lg:justify-center lg:px-2"
            } ${
              isDark 
                ? "text-amber-400 hover:bg-amber-500/10" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {isDark ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            <span className={`${collapsed && "lg:hidden"}`}>
              {isDark ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
          <button
            onClick={toggleLang}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium transition-colors ${
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
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium transition-colors ${
              collapsed && "lg:justify-center lg:px-2"
            } text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`${collapsed && "lg:hidden"}`}>{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[var(--sidebar-bg)]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <Plane className="w-4 h-4 text-brand/60" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString(
                  language === "ar" ? "ar-SA" : "en-GB",
                  { weekday: "long", day: "numeric", month: "long", year: "numeric" }
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-orange to-orange-500 text-white flex items-center justify-center font-semibold text-sm shadow-lg shadow-brand-orange/30">
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

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto travel-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
