"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { CURRENCIES, SUBSCRIPTION_PLANS } from "@/lib/constants";
import {
  Building2, Users, CreditCard, Bell, Shield, Palette,
  Upload, Save, CheckCircle, AlertCircle, MapPin, Phone,
  Mail, FileText, Database, Trash2, Key,
} from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: Building2 },
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

interface AgencyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export default function SettingsPage() {
  const { user, agency, updatePassword } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");

  // ── General tab state ──
  const [form, setForm] = useState({
    name: agency?.name ?? "",
    email: agency?.email ?? "",
    phone: agency?.phone ?? "",
    address: agency?.address ?? "",
    crNumber: agency?.crNumber ?? "",
    currency: agency?.currency ?? "OMR",
  });
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalMsg, setGeneralMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Keep form in sync if agency loads after mount
  useEffect(() => {
    if (agency) {
      setForm({
        name: agency.name ?? "",
        email: agency.email ?? "",
        phone: agency.phone ?? "",
        address: agency.address ?? "",
        crNumber: agency.crNumber ?? "",
        currency: agency.currency ?? "OMR",
      });
    }
  }, [agency?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGeneralSave = async () => {
    setGeneralSaving(true);
    setGeneralMsg(null);
    if (!supabase || !agency?.id) {
      setGeneralMsg({ ok: true, text: "Settings saved locally." });
      setGeneralSaving(false);
      return;
    }
    const { error } = await supabase
      .from("agencies")
      .update({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        cr_number: form.crNumber,
        currency: form.currency,
      })
      .eq("id", agency.id);
    if (error) {
      setGeneralMsg({ ok: false, text: error.message });
    } else {
      setGeneralMsg({ ok: true, text: "Agency profile saved." });
      setTimeout(() => setGeneralMsg(null), 3000);
    }
    setGeneralSaving(false);
  };

  // ── Users tab state ──
  const [agencyUsers, setAgencyUsers] = useState<AgencyUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "users") return;
    if (!supabase || !agency?.id) return;
    setUsersLoading(true);
    supabase
      .from("users")
      .select("id, name, email, role, active")
      .eq("agency_id", agency.id)
      .then(({ data }) => {
        if (data) setAgencyUsers(data as AgencyUser[]);
        setUsersLoading(false);
      });
  }, [activeTab, agency?.id]);

  // ── Security tab state ──
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handlePasswordChange = async () => {
    setPasswordMsg(null);
    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg({ ok: false, text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: "Passwords do not match." });
      return;
    }
    setPasswordSaving(true);
    try {
      await updatePassword(newPassword);
      setPasswordMsg({ ok: true, text: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setPasswordMsg({ ok: false, text: msg });
    }
    setPasswordSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("settings")}</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your agency preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab nav */}
        <div className="lg:w-64 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {/* ── GENERAL ── */}
          {activeTab === "general" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center relative shrink-0">
                  <Building2 className="w-8 h-8 text-slate-400" />
                  <button className="absolute bottom-0 right-0 w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center shadow-sm" title="Upload logo">
                    <Upload className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <h3 className="font-bold text-navy">{t("agencyProfile")}</h3>
                  <p className="text-sm text-slate-500">Changes are saved to the database</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("agencyName")}</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("email")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("phone")}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("address")}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={form.address}
                      onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("crNumber")}</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={form.crNumber}
                      onChange={(e) => setForm((p) => ({ ...p, crNumber: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("currency")}</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {generalMsg && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${generalMsg.ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {generalMsg.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {generalMsg.text}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleGeneralSave}
                  disabled={generalSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-deep-blue text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                >
                  {generalSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {generalSaving ? "Saving…" : t("save")}
                </button>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === "users" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy">{t("usersRoles")}</h3>
                <p className="text-xs text-slate-400">Invite functionality coming soon</p>
              </div>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-3 py-3 text-left font-medium">Name</th>
                        <th className="px-3 py-3 text-left font-medium">Email</th>
                        <th className="px-3 py-3 text-left font-medium">Role</th>
                        <th className="px-3 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agencyUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                            {supabase ? "No users found" : "Supabase not configured — showing demo"}
                          </td>
                        </tr>
                      ) : (
                        agencyUsers.map((u) => (
                          <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="px-3 py-3 font-medium text-slate-900">{u.name}</td>
                            <td className="px-3 py-3 text-slate-600 text-xs truncate max-w-[200px]">{u.email}</td>
                            <td className="px-3 py-3">
                              <span className="capitalize text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{u.role}</span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${u.active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                {u.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── SUBSCRIPTION ── */}
          {activeTab === "subscription" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-navy">{t("currentPlan")}</h3>
                    <p className="text-sm text-slate-500">
                      {agency ? `Plan: ${agency.plan} · Status: ${agency.status}` : "Loading…"}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-brand text-white text-xs font-bold rounded-full capitalize">
                    {agency?.plan ?? "trial"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  {SUBSCRIPTION_PLANS.map((plan) => {
                    const isCurrent = plan.id === agency?.plan;
                    return (
                      <div key={plan.id} className={`border rounded-xl p-4 transition-all ${isCurrent ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-slate-200"}`}>
                        <h4 className="font-bold text-navy">{plan.name}</h4>
                        <p className="text-2xl font-bold text-brand mt-2">{plan.priceOmr} <span className="text-sm font-normal text-slate-500">OMR/mo</span></p>
                        <ul className="mt-3 space-y-1">
                          {plan.features.map((f, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <CheckCircle className="w-3 h-3 text-brand mt-0.5 shrink-0" />{f}
                            </li>
                          ))}
                        </ul>
                        <button
                          className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors ${isCurrent ? "bg-brand text-white cursor-default" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                          disabled={isCurrent}
                        >
                          {isCurrent ? "Current Plan" : plan.id === "enterprise" ? t("contactSales") : t("upgrade")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-navy mb-2">Notification Preferences</h3>
              {["New booking created", "Payment received", "Invoice generated", "Commission paid", "System updates"].map((label, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{label}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === "security" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="font-bold text-navy mb-2">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              {passwordMsg && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${passwordMsg.ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {passwordMsg.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {passwordMsg.text}
                </div>
              )}

              <button
                onClick={handlePasswordChange}
                disabled={passwordSaving || !supabase}
                className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-deep-blue text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {passwordSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {passwordSaving ? "Updating…" : "Update Password"}
              </button>
              {!supabase && (
                <p className="text-xs text-slate-400">Password changes require Supabase to be configured.</p>
              )}
            </div>
          )}

          {/* ── APPEARANCE ── */}
          {activeTab === "appearance" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h3 className="font-bold text-navy mb-2">Appearance</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "ar")}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية (RTL)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Switching to Arabic enables right-to-left layout.</p>
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <button
                  onClick={() => alert("Data export is available from the Reports page.")}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <Database className="w-4 h-4" /> Export all data (use Reports page)
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                      alert("Please contact support@traveldeskpro.app to delete your account.");
                    }
                  }}
                  className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
