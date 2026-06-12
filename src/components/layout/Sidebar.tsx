"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCheck,
  BarChart3,
  Calendar,
  Settings,
  Shield,
  Menu,
  X,
  Briefcase,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "dashboard" },
  { href: "/bookings", icon: Plane, label: "bookings" },
  { href: "/customers", icon: Users, label: "customers" },
  { href: "/invoices", icon: FileText, label: "invoices" },
  { href: "/agents", icon: UserCheck, label: "agents" },
  { href: "/reports", icon: BarChart3, label: "reports" },
  { href: "/calendar", icon: Calendar, label: "calendar" },
  { href: "/settings", icon: Settings, label: "settings" },
  { href: "/admin", icon: Shield, label: "saasAdmin", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "owner" || user?.role === "admin";

  const filteredNav = navItems.filter((item) => {
    if (item.adminOnly) return isAdmin;
    return true;
  });

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 z-50 md:hidden bg-white p-2 rounded-lg shadow-md border border-slate-200"
        style={{ [isRTL ? "left" : "right"]: "1rem" }}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : isRTL ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0",
          isRTL ? "border-l border-r-0" : ""
        )}
        style={{ right: isRTL ? "0" : "auto", left: isRTL ? "auto" : "0" }}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-brand-orange flex items-center justify-center shadow-sm">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-navy leading-tight">{t("appName")}</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{t("tagline")}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-brand" : "text-slate-400")} />
                <span>{t(item.label as any)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-gradient-to-br from-deep-blue to-brand rounded-lg p-3 text-white">
            <p className="text-xs font-medium opacity-90">{t("plan")}</p>
            <p className="text-sm font-bold mt-0.5">Professional</p>
            <p className="text-[10px] opacity-75 mt-1">{t("currentPlan")}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
