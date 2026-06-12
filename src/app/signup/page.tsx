"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Globe, Building2, Mail, Phone, MapPin, Lock, CheckCircle } from "lucide-react";
import { CURRENCIES, SUBSCRIPTION_PLANS } from "@/lib/constants";

export default function SignupPage() {
  const { t, language, setLanguage } = useLanguage();
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    agencyName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    crNumber: "",
    currency: "OMR",
    language: "en",
    plan: "professional",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    setError("");
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(form);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-deep-blue/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
              <img src="/images/icon traveldesk.png" alt="TravelDesk Pro" className="w-14 h-14 object-contain drop-shadow-lg" />
            </div>
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-brand-orange rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
              Pro
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">TravelDesk Pro</h1>
          <p className="text-blue-200/80 text-sm font-medium">The all-in-one platform for modern travel agencies.</p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{t("createAccount")}</h2>
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s ? "bg-brand text-white shadow-lg shadow-brand/30" : "bg-white/10 text-white/40 border border-white/10"
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`h-1 flex-1 rounded-full transition-all ${step > s ? "bg-brand" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>


          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm font-medium mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-1.5">{t("agencyName")} *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={form.agencyName} onChange={(e) => update("agencyName", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all backdrop-blur-sm" placeholder="Your Travel Agency" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">{t("email")} *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all backdrop-blur-sm" placeholder="you@agency.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">{t("phone")} *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all backdrop-blur-sm" placeholder="+968 9000 0000" required />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-1.5">{t("password")} *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all backdrop-blur-sm" placeholder="••••••••" required />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-1.5">{t("address")}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all backdrop-blur-sm" placeholder="Muscat, Oman" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">{t("crNumber")}</label>
                  <input value={form.crNumber} onChange={(e) => update("crNumber", e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all backdrop-blur-sm" placeholder="CR-123456" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">{t("currency")}</label>
                  <select value={form.currency} onChange={(e) => update("currency", e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all backdrop-blur-sm">
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className="text-slate-900">{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">{t("language")}</label>
                  <select value={form.language} onChange={(e) => update("language", e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all backdrop-blur-sm">
                    <option value="en" className="text-slate-900">English</option>
                    <option value="ar" className="text-slate-900">العربية</option>
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => update("plan", plan.id)}
                    className={`cursor-pointer border rounded-xl p-5 transition-all relative ${
                      form.plan === plan.id
                        ? "border-brand bg-brand/10 ring-1 ring-brand shadow-lg shadow-brand/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {form.plan === plan.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand flex items-center justify-center text-white">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                    <h3 className="font-bold text-white">{plan.name}</h3>
                    <p className="text-2xl font-bold text-brand mt-2">
                      {plan.priceOmr} <span className="text-sm font-normal text-white/40">OMR{t("perMonth")}</span>
                    </p>
                    <ul className="mt-3 space-y-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                          <span className="text-brand mt-0.5">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  Back
                </button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="px-6 py-2.5 bg-brand hover:bg-brand/90 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-brand/20 hover:shadow-brand/30 hover:scale-[1.02] active:scale-[0.98]">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-gradient-to-r from-brand to-deep-blue text-white font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-brand/20 hover:shadow-brand/30 hover:scale-[1.02] active:scale-[0.98]">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {t("createAccount")}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand hover:text-brand-orange font-medium transition-colors">
              {t("login")}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          © {new Date().getFullYear()} TravelDesk Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
}
