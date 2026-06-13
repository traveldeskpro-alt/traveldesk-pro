"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, ArrowLeft, Globe, Building2, Mail, Phone, MapPin, Lock, CheckCircle, Check } from "lucide-react";
import { CURRENCIES, SUBSCRIPTION_PLANS } from "@/lib/constants";

const STEPS = [
  { id: 1, label: "Agency Info" },
  { id: 2, label: "Business Info" },
  { id: 3, label: "Subscription" },
];

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
    <div className="min-h-screen w-full bg-[#F6F8FC] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#2563EB]/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[460px] h-[360px] rounded-full bg-[#F97316]/5 blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
              <img src="/images/icon traveldesk.png" alt="TravelDesk Pro" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">TravelDesk</span>
              <span className="text-2xl font-bold text-[#F97316]">Pro</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">The complete platform for modern travel agencies.</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[28px] shadow-xl shadow-slate-200/50 p-6 sm:p-8 lg:p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">{t("createAccount") || "Create your account"}</h2>
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 border border-slate-100 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s) => (
              <div key={s.id} className="flex-1 flex items-center gap-2">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all shrink-0 ${
                    step > s.id
                      ? "bg-[#2563EB] text-white"
                      : step === s.id
                      ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30 ring-4 ring-[#2563EB]/10"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}>
                    {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step >= s.id ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
                </div>
                {s.id < 3 && (
                  <div className={`h-0.5 flex-1 rounded-full transition-all -mt-5 sm:-mt-6 ${step > s.id ? "bg-[#2563EB]" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("agencyName") || "Agency Name"} *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={form.agencyName} onChange={(e) => update("agencyName", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all" placeholder="Your Travel Agency" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("email") || "Email"} *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all" placeholder="you@agency.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("phone") || "Phone"} *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all" placeholder="+968 9000 0000" required />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("password") || "Password"} *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all" placeholder="••••••••" required minLength={6} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("address") || "Address"}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all" placeholder="Muscat, Oman" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("crNumber") || "CR Number"}</label>
                  <input value={form.crNumber} onChange={(e) => update("crNumber", e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all" placeholder="CR-123456" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("currency") || "Currency"}</label>
                  <select value={form.currency} onChange={(e) => update("currency", e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all">
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("language") || "Language"}</label>
                  <select value={form.language} onChange={(e) => update("language", e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all">
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
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
                        ? "border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB] shadow-lg shadow-[#2563EB]/10"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {form.plan === plan.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center text-white">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                    <h3 className="font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-2xl font-bold text-[#2563EB] mt-2">
                      {plan.priceOmr} <span className="text-sm font-normal text-slate-400">OMR{t("perMonth") || "/mo"}</span>
                    </p>
                    <ul className="mt-3 space-y-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                          <span className="text-[#F97316] mt-0.5">✓</span>
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
                <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-[#2563EB]/20 hover:shadow-[#2563EB]/30 hover:scale-[1.02] active:scale-[0.98]">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-[#2563EB]/20 hover:shadow-[#2563EB]/30 hover:scale-[1.02] active:scale-[0.98]">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {t("createAccount") || "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#2563EB] hover:text-[#1d4ed8] font-medium transition-colors">
              {t("login") || "Sign In"}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} TravelDesk Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
}
