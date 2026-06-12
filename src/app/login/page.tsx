"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Eye, EyeOff, Globe, ArrowRight, Sparkles, Plane, MapPin, Shield } from "lucide-react";

export default function LoginPage() {
  const { t, language, setLanguage } = useLanguage();
  const { login, startDemo, isLoading } = useAuth();
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
      setError(t("error"));
    }
  };

  const fillDemo = async () => {
    setError("");
    try {
      await startDemo();
      router.push("/dashboard");
    } catch {
      setError(t("error"));
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] relative overflow-hidden">
      {/* Background abstract shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#2563EB]/[0.04] blur-3xl" />
        <div className="absolute top-1/2 -right-64 w-[800px] h-[800px] rounded-full bg-[#3B82F6]/[0.03] blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full bg-[#60A5FA]/[0.03] blur-3xl" />
      </div>

      {/* Airplane SVG */}
      <div className="absolute top-24 right-[40%] lg:right-[55%] z-10 pointer-events-none animate-float-slow">
        <svg width="80" height="40" viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 20L25 12L75 8L78 10L30 18L25 20L30 22L78 30L75 32L25 28L5 20Z" fill="#2563EB" fillOpacity="0.15"/>
          <path d="M5 20L25 14L70 10L72 11L28 18L25 20L28 22L72 29L70 30L25 26L5 20Z" fill="#2563EB" fillOpacity="0.25"/>
          <ellipse cx="72" cy="20" rx="3" ry="2" fill="#2563EB" fillOpacity="0.3"/>
        </svg>
      </div>

      {/* LEFT SIDE - Branding */}
      <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-between px-8 py-8 lg:px-16 lg:py-12 min-h-[40vh] lg:min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <img src="/images/icon traveldesk.png" alt="TravelDesk Pro" className="w-7 h-7 object-contain" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-[#0F172A]">TravelDesk</span>
            <span className="text-xl font-bold text-[#2563EB]">Pro</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-lg mt-8 lg:mt-0">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#0F172A] leading-[1.15] tracking-tight">
            Smart. Simple.
            <br />
            <span className="text-[#2563EB]">Powerful.</span>
          </h1>
          <p className="mt-4 text-lg text-[#64748B] leading-relaxed">
            The all-in-one platform for modern travel agencies.
          </p>
          <div className="mt-10 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF7ED] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div><p className="font-semibold text-[#0F172A] text-[15px]">Manage Bookings</p><p className="text-sm text-[#64748B] mt-0.5">Easily manage all bookings in one place.</p></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div><p className="font-semibold text-[#0F172A] text-[15px]">Track Performance</p><p className="text-sm text-[#64748B] mt-0.5">Reports and analytics for your growth.</p></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div><p className="font-semibold text-[#0F172A] text-[15px]">Serve Better</p><p className="text-sm text-[#64748B] mt-0.5">Delight your customers every time.</p></div>
            </div>
          </div>
        </div>

        <div className="mt-8 lg:mt-0 relative">
          <svg viewBox="0 0 500 120" className="w-full max-w-lg opacity-60" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120 L0 80 L40 50 L80 75 L120 40 L160 70 L200 35 L240 60 L280 30 L320 55 L360 25 L400 50 L440 20 L500 60 L500 120Z" fill="#CBD5E1" fillOpacity="0.3"/>
            <path d="M0 120 L0 90 L50 65 L100 85 L150 55 L200 75 L250 45 L300 70 L350 40 L400 60 L450 35 L500 55 L500 120Z" fill="#94A3B8" fillOpacity="0.2"/>
            <ellipse cx="200" cy="75" rx="35" ry="22" fill="#E2E8F0" fillOpacity="0.5"/>
            <ellipse cx="200" cy="70" rx="28" ry="18" fill="#F1F5F9" fillOpacity="0.6"/>
            <rect x="190" y="85" width="20" height="35" rx="2" fill="#E2E8F0" fillOpacity="0.5"/>
            <rect x="160" y="55" width="4" height="65" rx="2" fill="#CBD5E1" fillOpacity="0.5"/>
            <circle cx="162" cy="52" r="3" fill="#CBD5E1" fillOpacity="0.5"/>
            <rect x="236" y="55" width="4" height="65" rx="2" fill="#CBD5E1" fillOpacity="0.5"/>
            <circle cx="238" cy="52" r="3" fill="#CBD5E1" fillOpacity="0.5"/>
            <rect x="320" y="60" width="25" height="60" rx="2" fill="#E2E8F0" fillOpacity="0.4"/>
            <rect x="350" y="50" width="20" height="70" rx="2" fill="#CBD5E1" fillOpacity="0.4"/>
            <rect x="375" y="65" width="22" height="55" rx="2" fill="#E2E8F0" fillOpacity="0.4"/>
            <rect x="405" y="55" width="18" height="65" rx="2" fill="#E2E8F0" fillOpacity="0.4"/>
            <rect x="430" y="70" width="24" height="50" rx="2" fill="#E2E8F0" fillOpacity="0.4"/>
            <path d="M0 115 L500 115" stroke="#CBD5E1" strokeWidth="1" strokeOpacity="0.3"/>
            <ellipse cx="200" cy="115" rx="40" ry="2" fill="#CBD5E1" fillOpacity="0.2"/>
            <ellipse cx="350" cy="115" rx="50" ry="2" fill="#CBD5E1" fillOpacity="0.2"/>
          </svg>
        </div>
      </div>

      {/* RIGHT SIDE - Login Card */}
      <div className="relative z-10 w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-8 lg:px-12 lg:py-12">
        <div className="absolute top-6 right-6 lg:top-8 lg:right-8">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "ar")}
              className="appearance-none bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 pl-10 pr-8 text-sm font-medium text-[#334155] shadow-sm hover:border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all cursor-pointer"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        <div className="w-full max-w-[500px] bg-white rounded-[28px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-8 lg:p-10 border border-[#F1F5F9]">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#0F172A]">Welcome back</h2>
            <p className="text-sm text-[#64748B] mt-1.5">Sign in to your agency workspace</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">Email</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] text-[15px] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all hover:border-[#CBD5E1]"
                  placeholder="you@agency.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] text-[15px] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all hover:border-[#CBD5E1]"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2.5 text-[#475569] cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer" />
                <span className="group-hover:text-[#334155] transition-colors">Remember me</span>
              </label>
              <Link href="#" className="font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white font-semibold text-[15px] shadow-lg shadow-[#2563EB]/25 hover:shadow-[#2563EB]/35 hover:translate-y-[-1px] active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none"
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-[#94A3B8]">or</span>
            </div>
          </div>

          <button
            onClick={fillDemo}
            className="w-full py-3.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] font-semibold text-[15px] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            Explore Demo Workspace
          </button>
          <p className="text-center text-xs text-[#94A3B8] mt-2.5">
            See how TravelDesk Pro works with sample data.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 lg:gap-8">
          <div className="flex items-center gap-2 text-[#64748B]">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Secure</span>
          </div>
          <div className="w-px h-4 bg-[#E2E8F0]" />
          <div className="flex items-center gap-2 text-[#64748B]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            <span className="text-sm font-medium">Cloud-Based</span>
          </div>
          <div className="w-px h-4 bg-[#E2E8F0]" />
          <div className="flex items-center gap-2 text-[#64748B]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
            <span className="text-sm font-medium">Arabic Support</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(10px) translateY(-5px); }
          50% { transform: translateX(20px) translateY(0); }
          75% { transform: translateX(10px) translateY(5px); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
