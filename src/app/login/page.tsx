"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Eye, EyeOff, Globe, ArrowRight, Sparkles } from "lucide-react";

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
      setError(t("error") || "Invalid email or password.");
    }
  };

  const fillDemo = async () => {
    setError("");
    try {
      await startDemo();
      router.push("/dashboard");
    } catch {
      setError(t("error") || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background image for the whole page */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/traveldesk-logo.png')", opacity: 0.08 }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]" />
      
      {/* Decorative shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#2563EB]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full bg-[#3B82F6]/10 blur-3xl" />
      </div>

      {/* LEFT SIDE - Branding */}
      <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-between px-8 py-10 lg:px-16 lg:py-14 min-h-[35vh] lg:min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <img src="/images/icon traveldesk.png" alt="TravelDesk Pro" className="w-7 h-7 object-contain" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">TravelDesk</span>
            <span className="text-xl font-bold text-[#60A5FA]">Pro</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-lg mt-6 lg:mt-0">
          <h1 className="text-4xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
            Smart. Simple.
            <br />
            <span className="text-[#60A5FA]">Powerful.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-md">
            The all-in-one platform for modern travel agencies. Manage bookings, customers, invoices, and agents in one place.
          </p>
          
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-[#F97316]/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="font-semibold text-white text-sm">Manage Bookings</p>
              <p className="text-xs text-slate-400 mt-1">All bookings in one place.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-[#22C55E]/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <p className="font-semibold text-white text-sm">Track Performance</p>
              <p className="text-xs text-slate-400 mt-1">Reports and analytics.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB]/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <p className="font-semibold text-white text-sm">Serve Better</p>
              <p className="text-xs text-slate-400 mt-1">Delight customers.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 lg:mt-0">
          <p className="text-xs text-slate-500">
            © 2026 TravelDesk Pro. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Login Card */}
      <div className="relative z-10 w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-8 lg:px-12">
        <div className="w-full max-w-[440px]">
          {/* Sign Up button at top */}
          <div className="mb-4 text-center">
            <p className="text-slate-400 text-sm mb-3">New to TravelDesk Pro?</p>
            <Link href="/signup" className="inline-block w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all">
              Create Account — Start Free Trial
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] shadow-2xl p-8 lg:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-sm text-slate-300 mt-1.5">Sign in to your agency workspace</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB]/50 transition-all hover:bg-white/15"
                    placeholder="you@agency.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-white/20 bg-white/10 text-white text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB]/50 transition-all hover:bg-white/15"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/30 bg-white/10 text-[#2563EB] focus:ring-[#2563EB]/30 cursor-pointer" />
                  <span className="group-hover:text-white transition-colors text-sm">Remember me</span>
                </label>
                <Link href="#" className="font-medium text-[#60A5FA] hover:text-[#93C5FD] transition-colors text-sm">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white font-semibold text-[15px] shadow-lg shadow-[#2563EB]/25 hover:shadow-[#2563EB]/40 hover:translate-y-[-1px] active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none"
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
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-transparent px-4 text-sm text-slate-400">or</span>
              </div>
            </div>

            <button
              onClick={fillDemo}
              className="w-full py-3.5 rounded-xl border border-white/20 bg-white/5 text-white font-semibold text-[15px] hover:bg-white/10 hover:border-white/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              Explore Demo Workspace
            </button>
            <p className="text-center text-xs text-slate-400 mt-2.5">
              See how TravelDesk Pro works with sample data.
            </p>
          </div>

          <div className="mt-5 text-center">
            <p className="text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#60A5FA] hover:text-white font-medium transition-colors">
                Create Account
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span className="text-xs font-medium">Secure</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                <span className="text-xs font-medium">Cloud-Based</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                <span className="text-xs font-medium">Arabic Support</span>
              </div>
            </div>

            {/* Language button moved to bottom right, subtle */}
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
