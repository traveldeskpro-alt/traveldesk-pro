"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDataMode } from "@/context/DataModeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAgencyBranding, useWhatsAppSettings } from "@/hooks/useDataStore";
import { supabase } from "@/lib/supabase";
import { CURRENCIES, ROLES, SUBSCRIPTION_PLANS } from "@/lib/constants";
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
  Briefcase,
  MapPin,
  Phone,
  Mail,
  FileText,
  MessageCircle,
  Database,
  Trash2,
  Edit2,
  X,
  UserPlus,
  AlertCircle,
} from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: Building2 },
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "whatsapp", label: "WhatsApp Business Settings", icon: MessageCircle },
];

const notificationLabels = [
  "New booking created",
  "Payment received",
  "Invoice generated",
  "Commission paid",
  "System updates",
];

const defaultNotifications = notificationLabels.reduce<Record<string, boolean>>((acc, label) => {
  acc[label] = true;
  return acc;
}, {});

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

type SubscriptionPlanView = {
  id: "starter" | "professional" | "enterprise";
  name: string;
  priceOmr: number;
  maxUsers: number | null;
  maxBookings: number | null;
  features: string[];
  isActive: boolean;
};

const editableRoles = ROLES.filter((role) => role.id !== "super_admin");

export default function SettingsPage() {
  const { user, agency, refreshProfile, updatePassword } = useAuth();
  const { useLocalStorage } = useDataMode();
  const { t, setLanguage } = useLanguage();
  const { branding, update: updateBranding } = useAgencyBranding();
  const { settings: whatsappSettings, update: updateWhatsAppSettings } = useWhatsAppSettings();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [users, setUsers] = useState<SettingsUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SettingsUser | null>(null);
  const [userSaving, setUserSaving] = useState(false);
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "viewer", active: true });
  const [plans, setPlans] = useState<SubscriptionPlanView[]>(SUBSCRIPTION_PLANS as SubscriptionPlanView[]);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanView["id"]>("starter");
  const [plansLoading, setPlansLoading] = useState(true);
  const [subscriptionSaving, setSubscriptionSaving] = useState<string | null>(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [notificationsSaved, setNotificationsSaved] = useState(false);
  const [securityForm, setSecurityForm] = useState({ newPassword: "", confirmPassword: "" });
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    crNumber: "",
    currency: "OMR",
    language: "en" as "en" | "ar",
    logoUrl: "",
  });

  useEffect(() => {
    if (!agency) return;
    setSelectedPlanId((agency.plan as SubscriptionPlanView["id"]) || "starter");
    setProfileForm({
      name: branding.name || agency.name || "",
      email: branding.email || agency.email || "",
      phone: branding.phone || agency.phone || "",
      address: branding.address || agency.address || "",
      crNumber: branding.crNumber || agency.crNumber || "",
      currency: agency.currency || "OMR",
      language: (agency.language as "en" | "ar") || "en",
      logoUrl: branding.logoUrl || agency.logoUrl || "",
    });
  }, [agency, branding]);

  useEffect(() => {
    let cancelled = false;
    async function loadUsers() {
      if (!user?.agencyId) {
        setUsers([]);
        setUsersLoading(false);
        return;
      }
      setUsersLoading(true);
      if (useLocalStorage || !supabase) {
        const raw = typeof window !== "undefined" ? localStorage.getItem(`tdp_users_${user.agencyId}`) : null;
        const stored = raw ? JSON.parse(raw) as SettingsUser[] : [];
        const currentUser = user ? [{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: true,
        }] : [];
        if (!cancelled) {
          setUsers(stored.length > 0 ? stored : currentUser);
          setUsersLoading(false);
        }
        return;
      }
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
  }, [user, useLocalStorage]);

  useEffect(() => {
    if (!user?.agencyId || typeof window === "undefined") return;
    const raw = localStorage.getItem(`tdp_settings_${user.agencyId}_notifications`);
    if (raw) {
      try {
        setNotifications({ ...defaultNotifications, ...JSON.parse(raw) });
      } catch {
        setNotifications(defaultNotifications);
      }
    } else {
      setNotifications(defaultNotifications);
    }
  }, [user?.agencyId]);

  useEffect(() => {
    let cancelled = false;
    async function loadPlans() {
      setPlansLoading(true);
      if (!useLocalStorage && supabase) {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("id,name,monthly_price,user_limit,booking_limit,features,is_active")
          .eq("is_active", true)
          .order("monthly_price", { ascending: true });
        if (!cancelled && !error && data?.length) {
          setPlans(data.map((plan) => ({
            id: plan.id as SubscriptionPlanView["id"],
            name: plan.name,
            priceOmr: Number(plan.monthly_price),
            maxUsers: plan.user_limit,
            maxBookings: plan.booking_limit,
            features: plan.features || [],
            isActive: plan.is_active,
          })));
        }
      }
      if (!cancelled) setPlansLoading(false);
    }
    loadPlans();
    return () => { cancelled = true; };
  }, [useLocalStorage]);

  const currentPlanId = selectedPlanId;
  const currentPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === currentPlanId) || SUBSCRIPTION_PLANS[0];

  const saveNotifications = (next: Record<string, boolean>) => {
    setNotifications(next);
    if (user?.agencyId && typeof window !== "undefined") {
      localStorage.setItem(`tdp_settings_${user.agencyId}_notifications`, JSON.stringify(next));
    }
    setNotificationsSaved(true);
    setTimeout(() => setNotificationsSaved(false), 1500);
  };

  const persistLocalUsers = (nextUsers: SettingsUser[]) => {
    if (user?.agencyId && typeof window !== "undefined") {
      localStorage.setItem(`tdp_users_${user.agencyId}`, JSON.stringify(nextUsers));
    }
  };

  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: "", email: "", role: "viewer", active: true });
    setUserError(null);
    setUserModalOpen(true);
  };

  const openEditUser = (target: SettingsUser) => {
    setEditingUser(target);
    setUserForm({ name: target.name, email: target.email, role: target.role, active: target.active });
    setUserError(null);
    setUserModalOpen(true);
  };

  const saveUser = async () => {
    setUserError(null);
    setUserMessage(null);
    if (!user?.agencyId) {
      setUserError("Agency profile is not loaded.");
      return;
    }
    if (!userForm.name.trim() || !userForm.email.trim()) {
      setUserError("Name and email are required.");
      return;
    }
    if (editingUser?.id === user.id && (!userForm.active || userForm.role !== user.role)) {
      setUserError("You cannot change your own role or deactivate your own account.");
      return;
    }

    setUserSaving(true);
    try {
      if (!useLocalStorage && supabase) {
        if (editingUser) {
          const { error } = await supabase
            .from("users")
            .update({
              name: userForm.name.trim(),
              email: userForm.email.trim(),
              role: userForm.role,
              active: userForm.active,
            })
            .eq("id", editingUser.id);
          if (error) throw error;
          setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...userForm, name: userForm.name.trim(), email: userForm.email.trim() } : u)));
        } else {
          const newUser = {
            id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
            agency_id: user.agencyId,
            name: userForm.name.trim(),
            email: userForm.email.trim(),
            role: userForm.role,
            active: userForm.active,
          };
          const { data, error } = await supabase.from("users").insert(newUser).select("id,name,email,role,active").single();
          if (error) throw error;
          setUsers((prev) => [...prev, data as SettingsUser]);
        }
      } else {
        setUsers((prev) => {
          const next = editingUser
            ? prev.map((u) => (u.id === editingUser.id ? { ...u, ...userForm, name: userForm.name.trim(), email: userForm.email.trim() } : u))
            : [...prev, {
              id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
              name: userForm.name.trim(),
              email: userForm.email.trim(),
              role: userForm.role,
              active: userForm.active,
            }];
          persistLocalUsers(next);
          return next;
        });
      }
      setUserMessage(editingUser ? "User changes saved." : "User added.");
      setTimeout(() => setUserMessage(null), 2000);
      setUserModalOpen(false);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Failed to save user.");
    } finally {
      setUserSaving(false);
    }
  };

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read logo file."));
    reader.readAsDataURL(file);
  });

  const handleLogoUpload = async (file: File | null) => {
    setLogoError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Please upload a PNG, JPG, SVG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo must be smaller than 2 MB.");
      return;
    }
    if (!agency?.id) {
      setLogoError("Agency profile is not loaded.");
      return;
    }

    setLogoUploading(true);
    try {
      let logoUrl: string;
      if (!useLocalStorage && supabase) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${agency.id}/logo-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("agency-assets")
          .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;
        logoUrl = supabase.storage.from("agency-assets").getPublicUrl(path).data.publicUrl;
        const { error: updateError } = await supabase
          .from("agencies")
          .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
          .eq("id", agency.id);
        if (updateError) throw updateError;
        await refreshProfile();
      } else {
        logoUrl = await readFileAsDataUrl(file);
      }
      setProfileForm((prev) => ({ ...prev, logoUrl }));
      updateBranding({ logoUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const saveSubscriptionPlan = async (planId: SubscriptionPlanView["id"]) => {
    setSubscriptionError(null);
    setSubscriptionMessage(null);
    if (!agency?.id) {
      setSubscriptionError("Agency profile is not loaded.");
      return;
    }
    setSubscriptionSaving(planId);
    try {
      if (!useLocalStorage && supabase) {
        const { error } = await supabase
          .from("agencies")
          .update({ plan: planId, updated_at: new Date().toISOString() })
          .eq("id", agency.id);
        if (error) throw error;
        await refreshProfile();
      }
      setSelectedPlanId(planId);
      setSubscriptionMessage("Subscription plan saved.");
      setTimeout(() => setSubscriptionMessage(null), 2000);
    } catch (err) {
      setSubscriptionError(err instanceof Error ? err.message : "Failed to save subscription plan.");
    } finally {
      setSubscriptionSaving(null);
    }
  };

  const handlePasswordSave = async () => {
    setSecurityError(null);
    setSecurityMessage(null);
    if (securityForm.newPassword.length < 8) {
      setSecurityError("Password must be at least 8 characters.");
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError("Passwords do not match.");
      return;
    }

    setSecuritySaving(true);
    try {
      await updatePassword(securityForm.newPassword);
      setSecurityForm({ newPassword: "", confirmPassword: "" });
      setSecurityMessage("Password updated.");
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setSecuritySaving(false);
    }
  };

  const saveWhatsAppSettings = () => {
    updateWhatsAppSettings({ provider: "wame", apiKey: "", instanceId: "", enabled: true });
    setWhatsappSaved(true);
    setTimeout(() => setWhatsappSaved(false), 1500);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaved(false);
    if (!agency?.id) {
      setSaveError("Agency profile is not loaded.");
      return;
    }
    if (useLocalStorage || !supabase) {
      updateBranding({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        crNumber: profileForm.crNumber.trim(),
        logoUrl: profileForm.logoUrl,
      });
      setLanguage(profileForm.language);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
          logo_url: profileForm.logoUrl || null,
          currency: profileForm.currency,
          language: profileForm.language,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agency.id)
        .select()
        .single();

      if (error) throw error;
      setLanguage(profileForm.language);
      updateBranding({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        crNumber: profileForm.crNumber.trim(),
        logoUrl: profileForm.logoUrl,
      });
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
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center relative overflow-hidden">
                  {profileForm.logoUrl ? (
                    <img src={profileForm.logoUrl} alt="Agency logo" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Briefcase className="w-8 h-8 text-slate-400" />
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    title="Upload agency logo"
                    className="absolute bottom-0 right-0 w-7 h-7 bg-brand text-white rounded-full flex items-center justify-center shadow-sm hover:bg-deep-blue disabled:opacity-60"
                  >
                    {logoUploading ? <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" /> : <Upload className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div>
                  <h3 className="font-bold text-navy">{t("agencyProfile")}</h3>
                  <p className="text-sm text-slate-500">Update your agency details</p>
                  <p className="mt-1 text-xs text-slate-400">Logo appears on invoice previews and PDFs.</p>
                </div>
              </div>
              {logoError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {logoError}
                </div>
              )}

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
                  <MessageCircle className="w-4 h-4" />
                  <button onClick={() => setActiveTab("whatsapp")} className="font-medium text-brand hover:underline">
                    WhatsApp Business Settings
                  </button>
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
                <div>
                  <h3 className="font-bold text-navy">{t("usersRoles")}</h3>
                  <p className="text-xs text-slate-500 mt-1">Manage agency team profiles, roles, and access status.</p>
                </div>
                <button onClick={openAddUser} className="inline-flex items-center gap-2 px-3 py-2 bg-brand hover:bg-deep-blue text-white text-sm font-medium rounded-lg">
                  <UserPlus className="w-4 h-4" /> Add User
                </button>
              </div>
              {userMessage && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{userMessage}</div>}
              {userError && !userModalOpen && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{userError}</div>}
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
                          <button onClick={() => openEditUser(u)} className="inline-flex items-center gap-1 text-brand text-xs font-medium hover:underline">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
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
              {userModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUserModalOpen(false)} />
                  <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-navy">{editingUser ? "Edit User" : "Add User"}</h2>
                        <p className="text-xs text-slate-500">Changes are saved to the agency users table.</p>
                      </div>
                      <button onClick={() => setUserModalOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                        <X className="h-5 w-5 text-slate-400" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                        <input value={userForm.name} onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                        <input type="email" value={userForm.email} onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select value={userForm.role} onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" disabled={editingUser?.id === user?.id}>
                          {editableRoles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-3 text-sm text-slate-700">
                        <input type="checkbox" checked={userForm.active} onChange={(e) => setUserForm((prev) => ({ ...prev, active: e.target.checked }))} disabled={editingUser?.id === user?.id} className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand" />
                        Active user
                      </label>
                      {userError && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {userError}
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <button onClick={() => setUserModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                      <button onClick={saveUser} disabled={userSaving} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-deep-blue disabled:opacity-50">
                        <Save className="h-4 w-4" /> {userSaving ? "Saving..." : "Save User"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subscription */}
          {activeTab === "subscription" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-navy">{t("currentPlan")}</h3>
                    <p className="text-sm text-slate-500">You are currently on the {currentPlan.name} plan</p>
                    <p className="text-xs text-slate-400 mt-1">Plan data loads from Supabase; saving updates this agency profile.</p>
                  </div>
                  <span className="px-3 py-1 bg-brand text-white text-xs font-bold rounded-full">{currentPlan.name}</span>
                </div>
                {plansLoading && <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">Loading subscription plans...</div>}
                {subscriptionMessage && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{subscriptionMessage}</div>}
                {subscriptionError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{subscriptionError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {plans.map((plan) => (
                    <div key={plan.id} className={`border rounded-xl p-4 transition-all ${plan.id === currentPlanId ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-slate-200"}`}>
                      <h4 className="font-bold text-navy">{plan.name}</h4>
                      <p className="text-2xl font-bold text-brand mt-2">{plan.priceOmr} <span className="text-sm font-normal text-slate-500">OMR/mo</span></p>
                      <ul className="mt-3 space-y-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-brand mt-0.5" />{f}</li>
                        ))}
                      </ul>
                      <button
                        onClick={() => saveSubscriptionPlan(plan.id)}
                        disabled={subscriptionSaving !== null || plan.id === currentPlanId}
                        title={plan.id === currentPlanId ? "Current plan" : "Save this subscription plan"}
                        className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${plan.id === currentPlanId ? "bg-brand text-white" : "border border-slate-200 text-slate-700 hover:border-brand hover:text-brand"}`}
                      >
                        {subscriptionSaving === plan.id ? "Saving..." : plan.id === currentPlanId ? "Current Plan" : "Save Plan"}
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
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-navy mb-2">Notification Preferences</h3>
                {notificationsSaved && <span className="text-xs text-emerald-600 font-medium">Saved</span>}
              </div>
              {notificationLabels.map((label) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{label}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                    checked={!!notifications[label]}
                      onChange={(e) => saveNotifications({ ...notifications, [label]: e.target.checked })}
                      className="sr-only peer"
                    />
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>
              {securityError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{securityError}</div>}
              {securityMessage && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{securityMessage}</div>}
              <button
                onClick={handlePasswordSave}
                disabled={securitySaving}
                className="px-4 py-2 bg-brand hover:bg-deep-blue text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {securitySaving ? "Saving..." : "Update Password"}
              </button>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-sm text-slate-500 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Two-factor authentication
                </div>
                <button disabled title="Two-factor authentication is coming soon" className="px-4 py-2 bg-slate-200 text-slate-500 text-sm font-medium rounded-lg cursor-not-allowed">Enable 2FA</button>
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
                  value={profileForm.language}
                  onChange={(e) => {
                    const nextLanguage = e.target.value as "en" | "ar";
                    setProfileForm((prev) => ({ ...prev, language: nextLanguage }));
                    setLanguage(nextLanguage);
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية (RTL)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Switching to Arabic will enable RTL layout</p>
              </div>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand hover:bg-deep-blue text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : saved ? "Saved" : "Save Appearance"}
              </button>
              {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {saveError}
                </div>
              )}
              <div className="pt-4 border-t border-slate-100">
                <button disabled title="Data export is coming soon" className="flex items-center gap-2 text-sm text-slate-400 px-3 py-2 rounded-lg cursor-not-allowed">
                  <Database className="w-4 h-4" /> Export all data
                </button>
              </div>
              <div className="pt-2">
                <button disabled title="Account deletion is coming soon" className="flex items-center gap-2 text-sm text-slate-400 px-3 py-2 rounded-lg cursor-not-allowed">
                  <Trash2 className="w-4 h-4" /> Delete account
                </button>
              </div>
            </div>
          )}

          {/* WhatsApp */}
          {activeTab === "whatsapp" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="font-bold text-navy">WhatsApp Business Settings</h3>
                <p className="text-sm text-slate-500 mt-1">Invoice sharing uses WhatsApp Web via wa.me with a pre-filled invoice summary.</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                WhatsApp Business API delivery is Coming Soon. Production actions only open WhatsApp Web; no API send is attempted.
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sharing method</label>
                  <input
                    readOnly
                    value="WhatsApp Web (wa.me)"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700"
                  />
                </div>
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={whatsappSettings.enabled}
                    onChange={(e) => updateWhatsAppSettings({ provider: "wame", enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  Remember wa.me as this agency's WhatsApp sharing preference
                </label>
                <p className="text-xs text-slate-500">API providers are not connected in this app, so invoice sharing does not claim WhatsApp Business API delivery.</p>
              </div>
              <button
                onClick={saveWhatsAppSettings}
                className="px-4 py-2 bg-brand hover:bg-deep-blue text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {whatsappSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {whatsappSaved ? "Saved" : "Save WhatsApp Web Preference"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
