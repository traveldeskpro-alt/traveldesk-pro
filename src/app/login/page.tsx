"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Eye, EyeOff, Globe, ArrowRight, Users, Plane, Hotel,
  FileCheck, Receipt, Building2, BarChart3, Radar, MessageCircle, Search,
} from "lucide-react";

const FEATURES = [
  { icon: Users, label: "Customer CRM" },
  { icon: Plane, label: "Flight Booking" },
  { icon: Hotel, label: "Hotel Booking" },
  { icon: FileCheck, label: "Visa Management" },
  { icon: Receipt, label: "Invoicing & Accounting" },
  { icon: Building2, label: "Supplier Management" },
  { icon: BarChart3, label: "Reports & Analytics" },
];

const UPCOMING = [
  { icon: Plane, label: "Airline API" },
  { icon: Search, label: "PNR Search" },
  { icon: Radar, label: "Flight Radar" },
  { icon: MessageCircle, label: "WhatsApp API" },
  { icon: Hotel, label: "Hotel API" },
];

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* LEFT SIDE - Hero / Branding */}
      <div className="relative w-full lg:w-1/2 flex flex-col justify-between px-8 py-10 lg:px-16 lg:py-14 min-h-[40vh] lg:min-h-screen bg-[#F6F8FC] overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#2563EB]/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[460px] h-[360px] rounded-full bg-[#F97316]/5 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
            <img src="/images/icon traveldesk.png" alt="TravelDesk Pro" className="w-7 h-7 object-contain" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">TravelDesk</span>
            <span className="text-xl font-bold text-[#F97316]">Pro</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg mt-8 lg:mt-0">
          <h1 className="text-4xl lg:text-[3.4rem] font-bold text-slate-900 leading-[1.1] tracking-tight">
            Smart. Simple.
            <br />
            <span className="text-[#2563EB]">Powerful.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-500 leading-relaxed max-w-md">
            The complete platform for modern travel agencies.
          </p>

          <div className="mt-9 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FEATURES.map((f) => (
              <div key={f.label} className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-[#2563EB]" />
                </div>
                <p className="font-medium text-slate-700 text-[13px] leading-tight">{f.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold tracking-wider text-[#F97316] uppercase mb-3">Coming Soon</p>
            <div className="flex flex-wrap gap-2">
              {UPCOMING.map((u) => (
                <div key={u.label} className="flex items-center gap-1.5 bg-white border border-dashed border-slate-200 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500">
                  <u.icon className="w-3.5 h-3.5 text-[#F97316]" />
                  {u.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 lg:mt-0">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} TravelDesk Pro. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Login Card */}
      <div className="relative w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-10 lg:px-12 bg-white">
        <div className="w-full max-w-[440px]">
          <div className="bg-white border border-slate-100 rounded-[28px] shadow-xl shadow-slate-200/50 p-8 lg:p-10">
            <div className="text-center mb-8">
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

          </div>

          <div className="mt-5 text-center">
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#2563EB] hover:text-[#1d4ed8] font-medium transition-colors">
                Create Account
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span className="text-xs font-medium">Secure</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                <span className="text-xs font-medium">Cloud-Based</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                <span className="text-xs font-medium">Arabic Support</span>
              </div>
            </div>

            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase">{language === "en" ? "EN" : "AR"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
