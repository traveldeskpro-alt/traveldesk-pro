"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Eye, EyeOff, Globe, ArrowRight, Wallet, Users, Plane, Hotel,
  FileCheck, Receipt, BarChart3, TrendingUp, ArrowUpRight, ShieldCheck,
  Cloud, Languages,
} from "lucide-react";

// Static figures used purely to render the marketing dashboard preview.
// This is a visual mock — it never reads or writes real agency data.
const STAT_TILES = [
  { icon: Users, label: "Customers", value: "1,284", accent: "text-[#2563EB]", bg: "bg-[#2563EB]/10" },
  { icon: Plane, label: "Flights", value: "642", accent: "text-sky-600", bg: "bg-sky-100" },
  { icon: Hotel, label: "Hotels", value: "318", accent: "text-violet-600", bg: "bg-violet-100" },
  { icon: FileCheck, label: "Visas", value: "207", accent: "text-emerald-600", bg: "bg-emerald-100" },
  { icon: Receipt, label: "Invoices", value: "1,096", accent: "text-[#F97316]", bg: "bg-[#F97316]/10" },
];

const ANALYTICS_BARS = [
  { label: "Jan", height: 46 },
  { label: "Feb", height: 62 },
  { label: "Mar", height: 54 },
  { label: "Apr", height: 78 },
  { label: "May", height: 68 },
  { label: "Jun", height: 92 },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Bank-grade security" },
  { icon: Cloud, label: "Cloud-based" },
  { icon: Languages, label: "Arabic & English" },
];

function DashboardPreview() {
  return (
    <div className="relative w-full max-w-xl">
      {/* Floating accent cards behind the main panel */}
      <div className="absolute -top-5 -right-3 hidden sm:flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-slate-300/40 border border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-[11px] text-slate-400 leading-none">Net profit</p>
          <p className="text-sm font-bold text-slate-900 leading-tight mt-1">OMR 19,430</p>
        </div>
      </div>

      {/* Main dashboard window */}
      <div className="relative rounded-3xl bg-white border border-slate-100 shadow-2xl shadow-slate-300/50 overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <span className="w-3 h-3 rounded-full bg-red-400/80" />
          <span className="w-3 h-3 rounded-full bg-amber-400/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
          <div className="ml-3 flex items-center gap-2 text-xs font-medium text-slate-400">
            <BarChart3 className="w-3.5 h-3.5" />
            Agency Dashboard
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {/* Revenue highlight */}
          <div className="rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] p-5 text-white shadow-lg shadow-[#2563EB]/25">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/70">OMR Revenue</p>
                  <p className="text-2xl font-bold leading-tight mt-0.5">OMR 48,250</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                12.5%
              </span>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {STAT_TILES.map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.accent}`} />
                </div>
                <p className="mt-2 text-lg font-bold text-slate-900 leading-none">{s.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Booking analytics */}
          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Booking Analytics</p>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                +18% this quarter
              </span>
            </div>
            <div className="mt-4 flex items-stretch justify-between gap-2 h-24">
              {ANALYTICS_BARS.map((b, i) => (
                <div key={b.label} className="flex flex-1 items-end justify-center">
                  <div
                    className={`w-full max-w-[26px] rounded-t-md ${
                      i === ANALYTICS_BARS.length - 1
                        ? "bg-[#F97316]"
                        : "bg-[#2563EB]/80"
                    }`}
                    style={{ height: `${b.height}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between gap-2">
              {ANALYTICS_BARS.map((b) => (
                <span key={b.label} className="flex-1 text-center text-[10px] font-medium text-slate-400">
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { language, setLanguage } = useLanguage();
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F6F8FC]">
      {/* LEFT SIDE - Branding + Dashboard preview */}
      <div className="relative w-full lg:w-[56%] flex flex-col justify-between px-8 py-10 lg:px-14 lg:py-12 overflow-hidden">
        {/* Soft decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-[#2563EB]/5 blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-80px] w-[480px] h-[420px] rounded-full bg-[#F97316]/5 blur-3xl" />
        </div>

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
            <img src="/images/icon traveldesk.png" alt="TravelDesk Pro" className="w-7 h-7 object-contain" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">TravelDesk</span>
            <span className="text-xl font-bold text-[#F97316]">Pro</span>
          </div>
        </div>

        {/* Headline + preview */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-10 lg:py-0">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
              <BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" />
              Travel Agency Management Platform
            </span>
            <h1 className="mt-5 text-3xl lg:text-[2.75rem] font-bold text-slate-900 leading-[1.1] tracking-tight">
              Run your agency from
              <br className="hidden sm:block" />
              <span className="text-[#2563EB]"> one command center.</span>
            </h1>
            <p className="mt-4 text-base lg:text-lg text-slate-500 leading-relaxed max-w-md">
              Customers, flights, hotels, visas, invoices, and revenue — managed in real time.
            </p>
          </div>

          <div className="mt-9 hidden md:flex">
            <DashboardPreview />
          </div>

          {/* Trust badges */}
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-slate-500">
                <b.icon className="w-4 h-4 text-[#2563EB]" />
                <span className="text-sm font-medium">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-8 lg:mt-0">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} TravelDesk Pro. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Login Card */}
      <div className="relative w-full lg:w-[44%] flex flex-col items-center justify-center px-6 py-10 lg:px-14 bg-white lg:shadow-[-20px_0_60px_-30px_rgba(15,23,42,0.15)]">
        <div className="w-full max-w-[460px]">
          <div className="bg-white border border-slate-100 rounded-[28px] shadow-xl shadow-slate-200/60 p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1.5">Sign in to your agency workspace</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                    placeholder="you@agency.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2.5 text-slate-600 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/30 cursor-pointer" />
                  <span className="group-hover:text-slate-900 transition-colors text-sm">Remember me</span>
                </label>
                <Link href="/forgot-password" className="font-medium text-[#2563EB] hover:text-[#1d4ed8] transition-colors text-sm">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#2563EB] text-white font-semibold text-[15px] shadow-lg shadow-[#2563EB]/20 hover:bg-[#1d4ed8] hover:shadow-[#2563EB]/30 hover:translate-y-[-1px] active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#2563EB] hover:text-[#1d4ed8] font-semibold transition-colors">
                Create account
              </Link>
            </p>
          </div>

          {/* Footer row: language toggle */}
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase">{language === "en" ? "English" : "العربية"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
