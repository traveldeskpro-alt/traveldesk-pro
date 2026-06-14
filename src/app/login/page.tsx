"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Eye, EyeOff, ArrowRight, Globe, Sparkles } from "lucide-react";

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
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* ═══════════════════════════════════════════
          LEFT — Aviation Hero
      ═══════════════════════════════════════════ */}
      <div className="relative w-full lg:w-[58%] min-h-[40vh] lg:min-h-screen overflow-hidden flex flex-col"
        style={{ background: "linear-gradient(135deg, #060D1F 0%, #0B1532 35%, #0E2247 65%, #051428 100%)" }}
      >
        {/* Atmospheric glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }} />
          <div className="absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #6366F1 0%, transparent 70%)" }} />
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)" }} />
        </div>

        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            [8,12],[15,45],[22,8],[35,25],[42,60],[55,15],[68,38],[75,5],[82,52],[90,20],
            [12,70],[28,85],[48,78],[62,92],[78,68],[5,55],[38,40],[58,72],[85,35],[95,80],
            [18,30],[32,55],[50,18],[65,85],[80,12],[10,88],[25,20],[45,95],[70,42],[88,65],
          ].map(([x, y], i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{
                left: `${x}%`, top: `${y}%`,
                width: i % 5 === 0 ? "3px" : i % 3 === 0 ? "2px" : "1.5px",
                height: i % 5 === 0 ? "3px" : i % 3 === 0 ? "2px" : "1.5px",
                opacity: 0.2 + (i % 4) * 0.15,
              }}
            />
          ))}
        </div>

        {/* Runway perspective */}
        <div className="absolute bottom-0 left-0 right-0 h-56 pointer-events-none">
          <svg viewBox="0 0 800 224" className="w-full h-full" preserveAspectRatio="none">
            {/* Runway surface */}
            <polygon points="280,224 520,224 440,60 360,60" fill="#0F2A50" opacity="0.6" />
            {/* Runway edge lines */}
            <line x1="280" y1="224" x2="360" y2="60" stroke="#1D4ED8" strokeWidth="1" opacity="0.5" />
            <line x1="520" y1="224" x2="440" y2="60" stroke="#1D4ED8" strokeWidth="1" opacity="0.5" />
            {/* Centre dashes */}
            {[0.8, 0.64, 0.48, 0.32, 0.18].map((t, i) => {
              const x = 400 * (1 - t) + 400 * t;
              const y = 60 + (224 - 60) * t;
              const w = 2 + t * 6;
              const h = 2 + t * 14;
              return <rect key={i} x={x - w / 2} y={y} width={w} height={h} fill="#3B82F6" opacity={0.3 + t * 0.4} rx="1" />;
            })}
            {/* Runway lights */}
            {[0.05, 0.18, 0.32, 0.48, 0.64, 0.8, 0.92].map((t, i) => {
              const lx = 280 + (360 - 280) * t;
              const rx = 520 - (520 - 440) * t;
              const y = 224 - (224 - 60) * t;
              return (
                <g key={i}>
                  <circle cx={lx} cy={y} r={t * 3 + 1} fill="#60A5FA" opacity={0.5 + t * 0.3} />
                  <circle cx={rx} cy={y} r={t * 3 + 1} fill="#60A5FA" opacity={0.5 + t * 0.3} />
                </g>
              );
            })}
            {/* City horizon glow */}
            <rect x="0" y="185" width="800" height="39" fill="url(#cityGlow)" opacity="0.6" />
            <defs>
              <linearGradient id="cityGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Airplane SVG */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: "5%", bottom: "30%" }}>
          <svg viewBox="0 0 520 160" className="w-[75%] max-w-[480px] drop-shadow-2xl" style={{ filter: "drop-shadow(0 0 40px rgba(59,130,246,0.3))" }}>
            {/* Main fuselage */}
            <ellipse cx="260" cy="80" rx="200" ry="16" fill="white" opacity="0.92" />
            {/* Nose cone taper */}
            <path d="M460,80 Q490,80 508,79 Q515,79 508,81 Q490,80.5 460,80 Z" fill="white" opacity="0.92" />
            {/* Tail taper */}
            <path d="M60,80 Q40,80 22,82 Q15,83 22,78 Q40,79.5 60,80 Z" fill="white" opacity="0.85" />
            {/* Cockpit windows */}
            <ellipse cx="460" cy="76" rx="12" ry="5" fill="#93C5FD" opacity="0.7" />
            <ellipse cx="443" cy="76" rx="7" ry="4" fill="#BFDBFE" opacity="0.5" />
            {/* Main wings */}
            <path d="M230,80 L175,140 L205,140 L265,85 Z" fill="white" opacity="0.88" />
            <path d="M230,80 L175,28 L205,28 L265,75 Z" fill="white" opacity="0.75" />
            {/* Wing flap line */}
            <line x1="200" y1="138" x2="262" y2="84" stroke="#E2E8F0" strokeWidth="0.5" opacity="0.5" />
            {/* Engine pod — left lower wing */}
            <ellipse cx="210" cy="128" rx="22" ry="7" fill="#F1F5F9" opacity="0.8" />
            <ellipse cx="194" cy="128" rx="8" ry="7" fill="#CBD5E1" opacity="0.7" />
            {/* Tail fin (vertical stabiliser) */}
            <path d="M75,80 L58,42 L72,42 L88,78 Z" fill="white" opacity="0.88" />
            {/* Horizontal stabilisers */}
            <path d="M80,78 L50,98 L72,98 L88,80 Z" fill="white" opacity="0.78" />
            <path d="M80,82 L50,65 L72,65 L88,80 Z" fill="white" opacity="0.7" />
            {/* Engine glow */}
            <ellipse cx="194" cy="128" rx="5" ry="5" fill="#60A5FA" opacity="0.4" />
            {/* Wing body fairing */}
            <ellipse cx="245" cy="84" rx="22" ry="8" fill="#E2E8F0" opacity="0.4" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 px-8 pt-8">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
            <img src="/images/icon traveldesk.png" alt="TravelDesk Pro" className="w-6 h-6 object-contain" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-white/90">TravelDesk</span>
            <span className="text-lg font-bold text-[#F97316]">Pro</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 lg:px-14 py-8">
          <div className="max-w-lg">
            <p className="text-[#93C5FD] text-sm font-semibold tracking-widest uppercase mb-3">Premium Travel Agency Platform</p>
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              Elevate Every
              <br />
              <span className="text-[#60A5FA]">Journey.</span>
            </h1>
            <p className="mt-4 text-white/50 text-base leading-relaxed max-w-sm">
              The complete platform for modern travel agencies — bookings, invoicing, CRM, and analytics in one place.
            </p>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { value: "500+", label: "Agencies" },
                { value: "50+", label: "Countries" },
                { value: "1M+", label: "Bookings" },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-8 pb-8">
          <p className="text-xs text-white/25">© {new Date().getFullYear()} TravelDesk Pro. All rights reserved.</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT — Login Form
      ═══════════════════════════════════════════ */}
      <div className="w-full lg:w-[42%] flex flex-col items-center justify-center bg-white px-6 py-12 lg:px-10 lg:py-0 min-h-[60vh] lg:min-h-screen">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <img src="/images/icon traveldesk.png" alt="TravelDesk Pro" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-[#0F172A]">TravelDesk <span className="text-[#F97316]">Pro</span></span>
          </div>

          <div className="mb-8">
            <h2 className="text-[1.75rem] font-black text-[#0F172A] leading-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1.5">Sign in to your agency workspace</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Email address</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#0F172A] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] transition-all"
                  placeholder="you@agency.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-[#0F172A]">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-[#2563EB] hover:text-[#1d4ed8] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#0F172A] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] transition-all"
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: isLoading ? "#2563EB" : "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)",
                boxShadow: isLoading ? "none" : "0 4px 20px rgba(37,99,235,0.35)",
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs text-slate-400 font-medium uppercase tracking-wider">or</span>
            </div>
          </div>

          <Link
            href="/demo"
            className="w-full py-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:bg-slate-100 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#F97316]" />
            Explore Demo Workspace
          </Link>
          <p className="text-center text-xs text-slate-400 mt-2">Try with sample data — no account needed</p>

          <div className="mt-6 p-4 rounded-xl border border-[#2563EB]/15 bg-[#2563EB]/5">
            <p className="text-center text-sm text-slate-600">
              New agency?{" "}
              <Link href="/signup" className="text-[#2563EB] hover:text-[#1d4ed8] font-bold transition-colors">
                Create Account — Free Trial
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                Cloud-Based
              </div>
            </div>
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {language === "en" ? "EN" : "AR"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
