"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { CURRENCIES, SUBSCRIPTION_PLANS } from "@/lib/constants";
import {
  Building2,
  Users,
  CreditCard,
  Bell,
  Shield,
  Palette,
  Globe,
  Upload,
  Save,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  ArrowUpRight,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  FileText,
  MessageCircle,
  Database,
  Trash2,
} from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: Building2 },
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

export default function SettingsPage() {
  const { user, agency, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [users, setUsers] = useState<SettingsUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    crNumber: "",
    currency: "OMR",
    language: "en" as "en" | "ar",
  });

  useEffect(() => {
    if (!agency) return;
    setProfileForm({
      name: agency.name || "",
      email: agency.email || "",
      phone: agency.phone || "",
      address: agency.address || "",
      crNumber: agency.crNumber || "",
      currency: agency.currency || "OMR",
      language: (agency.language as "en" | "ar") || "en",
    });
  }, [agency]);

  useEffect(() => {
    let cancelled = false;
    async function loadUsers() {
      if (!user?.agencyId || !supabase) {
        setUsers([]);
        setUsersLoading(false);
        return;
      }
      setUsersLoading(true);
      const { data } = await supabase
        .from("users")
        .select("id,name,email,role,active")
        .eq("agency_id", user.agencyId)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setUsers((data || []) as SettingsUser[]);
        setUsersLoading(false);
      }
    }
    loadUsers();
    return () => { cancelled = true; };
  }, [user?.agencyId]);

  const handleSave = async () => {
    setSaveError(null);
    setSaved(false);
    if (!agency?.id) {
      setSaveError("Agency profile is not loaded.");
      return;
    }
    if (!supabase) {
      setSaveError("Settings persistence is unavailable because Supabase is not configured.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("agencies")
        .update({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim(),
          address: profileForm.address.trim() || null,
          cr_number: profileForm.crNumber.trim() || null,
          currency: profileForm.currency,
          language: profileForm.language,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agency.id)
        .select()
        .single();

      if (error) throw error;
      setLanguage(profileForm.language);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save agency profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("settings")}</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your agency preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
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
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General */}
          {activeTab === "general" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center relative">
                  <Briefcase className="w-8 h-8 text-slate-400" />
                  <button className="absolute bottom-0 right-0 w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center shadow-sm">
                    <Upload className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <h3 className="font-bold text-navy">{t("agencyProfile")}</h3>
                  <p className="text-sm text-slate-500">Update your agency details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("agencyName")}</label>
                  <input value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("email")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("phone")}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={profileForm.phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("address")}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={profileForm.address} onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("crNumber")}</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={profileForm.crNumber} onChange={(e) => setProfileForm((prev) => ({ ...prev, crNumber: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("currency")}</label>
                  <select value={profileForm.currency} onChange={(e) => setProfileForm((prev) => ({ ...prev, currency: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("language")}</label>
                  <select
                    value={profileForm.language}
                    onChange={(e) => {
                      const nextLanguage = e.target.value as "en" | "ar";
                      setProfileForm((prev) => ({ ...prev, language: nextLanguage }));
                      setLanguage(nextLanguage);
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MessageCircle className="w-4 h-4" /> WhatsApp Business Settings
                </div>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand hover:bg-deep-blue text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : saved ? "Saved" : t("save")}
                </button>
              </div>
              {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {saveError}
                </div>
              )}
            </div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy">{t("usersRoles")}</h3>
                <button className="px-3 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-deep-blue transition-colors">+ Invite User</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-3 py-3 text-left font-medium">Name</th>
                      <th className="px-3 py-3 text-left font-medium">Email</th>
                      <th className="px-3 py-3 text-left font-medium">Role</th>
                      <th className="px-3 py-3 text-left font-medium">Status</th>
                      <th className="px-3 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-3 py-3 font-medium text-slate-900">{u.name}</td>
                        <td className="px-3 py-3 text-slate-600">{u.email}</td>
                        <td className="px-3 py-3">
                          <span className="capitalize text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{u.role}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${u.active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            {u.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button className="text-slate-500 hover:text-brand text-xs font-medium">Edit</button>
                        </td>
                      </tr>
                    ))}
                    {!usersLoading && users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">No users found for this agency.</td>
                      </tr>
                    )}
                    {usersLoading && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">Loading users...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subscription */}
          {activeTab === "subscription" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-navy">{t("currentPlan")}</h3>
                    <p className="text-sm text-slate-500">You are currently on the Professional plan</p>
                  </div>
                  <span className="px-3 py-1 bg-brand text-white text-xs font-bold rounded-full">Professional</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <div key={plan.id} className={`border rounded-xl p-4 transition-all ${plan.id === "professional" ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-slate-200"}`}>
                      <h4 className="font-bold text-navy">{plan.name}</h4>
                      <p className="text-2xl font-bold text-brand mt-2">{plan.priceOmr} <span className="text-sm font-normal text-slate-500">OMR/mo</span></p>
                      <ul className="mt-3 space-y-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-brand mt-0.5" />{f}</li>
                        ))}
                      </ul>
                      <button className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors ${plan.id === "professional" ? "bg-brand text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                        {plan.id === "professional" ? "Current Plan" : plan.id === "enterprise" ? t("contactSales") : t("upgrade")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
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
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h3 className="font-bold text-navy mb-2">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                  <input type="password" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input type="password" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input type="password" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-sm text-slate-500 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Two-factor authentication
                </div>
                <button className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-deep-blue transition-colors">Enable 2FA</button>
              </div>
            </div>
          )}

          {/* Appearance */}
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
                <p className="text-xs text-slate-500 mt-1">Switching to Arabic will enable RTL layout</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <button className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                  <Database className="w-4 h-4" /> Export all data
                </button>
              </div>
              <div className="pt-2">
                <button className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
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
