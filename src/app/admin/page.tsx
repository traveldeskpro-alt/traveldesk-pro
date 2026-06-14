"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Building2, Users, CreditCard, Shield, CheckCircle, XCircle,
  Search, TrendingUp, Activity, DollarSign, FileText, RefreshCw,
  Lock, ChevronLeft, ChevronRight, AlertCircle, Edit,
} from "lucide-react";

interface AgencyRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  created_at: string;
  cr_number?: string;
}

const PLAN_COLORS: Record<string, string> = {
  enterprise: "bg-purple-50 text-purple-700 border-purple-200",
  professional: "bg-blue-50 text-blue-700 border-blue-200",
  starter: "bg-slate-50 text-slate-700 border-slate-200",
  trial: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  trial: "bg-amber-50 text-amber-700 border-amber-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
};

const PLANS = ["starter", "professional", "enterprise"];

export default function AdminPage() {
  const { user, agency } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("agencies");
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const isAdmin = user?.role === "owner" || user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    if (supabase) {
      // Super admins can see all agencies; regular admins only see their own
      const query = isSuperAdmin
        ? supabase.from("agencies").select("id, name, email, phone, plan, status, created_at, cr_number").order("created_at", { ascending: false })
        : supabase.from("agencies").select("id, name, email, phone, plan, status, created_at, cr_number").eq("id", agency?.id ?? "");
      query.then(({ data }) => {
        if (data) setAgencies(data as AgencyRow[]);
        setLoading(false);
      });
    } else {
      // No Supabase — show current agency only from auth context
      if (agency) {
        setAgencies([
          {
            id: agency.id,
            name: agency.name,
            email: agency.email,
            phone: agency.phone,
            plan: agency.plan,
            status: agency.status,
            created_at: agency.createdAt,
            cr_number: agency.crNumber,
          },
        ]);
      }
      setLoading(false);
    }
  }, [isAdmin, isSuperAdmin, agency?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleSuspend = async (id: string) => {
    if (!supabase) { setMsg("Supabase not configured."); return; }
    if (!confirm("Suspend this agency? Their users will not be able to log in.")) return;
    const { error } = await supabase.from("agencies").update({ status: "suspended" }).eq("id", id);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    setAgencies((prev) => prev.map((a) => (a.id === id ? { ...a, status: "suspended" } : a)));
    setMsg("Agency suspended.");
  };

  const handleActivate = async (id: string) => {
    if (!supabase) { setMsg("Supabase not configured."); return; }
    const { error } = await supabase.from("agencies").update({ status: "active" }).eq("id", id);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    setAgencies((prev) => prev.map((a) => (a.id === id ? { ...a, status: "active" } : a)));
    setMsg("Agency activated.");
  };

  const handlePlanChange = async (id: string, plan: string) => {
    if (!supabase) { setMsg("Supabase not configured."); return; }
    const { error } = await supabase.from("agencies").update({ plan }).eq("id", id);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    setAgencies((prev) => prev.map((a) => (a.id === id ? { ...a, plan } : a)));
    setMsg(`Plan updated to ${plan}.`);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-navy">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-1">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const filtered = agencies.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = 0; // Requires a billing module
  const totalAgencies = filtered.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {isSuperAdmin ? "Platform Admin" : "Agency Administration"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isSuperAdmin ? "Manage all agencies on the platform" : "Manage your agency account"}
          </p>
        </div>
        {!isSuperAdmin && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Agency Admin View
          </span>
        )}
      </div>

      {actionMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-brand/10 text-brand border border-brand/20 text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" /> {actionMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Agencies", value: totalAgencies, icon: Building2, color: "bg-blue-50 text-blue-700" },
          { label: "Active", value: agencies.filter((a) => a.status === "active").length, icon: CheckCircle, color: "bg-emerald-50 text-emerald-700" },
          { label: "Trial", value: agencies.filter((a) => a.status === "trial").length, icon: Activity, color: "bg-amber-50 text-amber-700" },
          { label: "Suspended", value: agencies.filter((a) => a.status === "suspended").length, icon: XCircle, color: "bg-red-50 text-red-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-xl font-bold text-navy">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("agencies")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "agencies" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Agencies
            </button>
            <button
              onClick={() => setActiveTab("plans")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "plans" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Plans
            </button>
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agencies…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
        </div>

        {activeTab === "agencies" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left font-medium">Agency</th>
                    <th className="px-4 py-3 text-left font-medium">Plan</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                    {isSuperAdmin && <th className="px-4 py-3 text-left font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No agencies found</td>
                    </tr>
                  ) : (
                    filtered.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{a.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{a.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          {isSuperAdmin ? (
                            <select
                              value={a.plan}
                              onChange={(e) => handlePlanChange(a.id, e.target.value)}
                              className={`text-xs font-semibold px-2 py-1 rounded-full border focus:outline-none ${PLAN_COLORS[a.plan] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}
                            >
                              {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          ) : (
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${PLAN_COLORS[a.plan] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}>
                              {a.plan}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[a.status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                            {a.status === "active" ? <CheckCircle className="w-3 h-3" /> : a.status === "suspended" ? <XCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">{a.created_at ? formatDate(a.created_at) : "—"}</td>
                        {isSuperAdmin && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {a.status !== "suspended" ? (
                                <button
                                  onClick={() => handleSuspend(a.id)}
                                  className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                  title="Suspend"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivate(a.id)}
                                  className="p-1.5 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                                  title="Activate"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "plans" && (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: "starter", name: "Starter", price: 30, features: ["Up to 3 users", "300 bookings/mo", "Basic reports", "Invoice generation"] },
                { id: "professional", name: "Professional", price: 40, features: ["Up to 10 users", "Unlimited bookings", "Advanced analytics", "Custom branding", "Priority support"] },
                { id: "enterprise", name: "Enterprise", price: 150, features: ["Unlimited users", "Unlimited everything", "Dedicated support", "Custom integrations", "SLA guarantee"] },
              ].map((plan) => (
                <div key={plan.id} className={`rounded-xl border p-5 ${plan.id === "professional" ? "border-brand bg-brand/5" : "border-slate-200"}`}>
                  <h3 className="font-bold text-navy">{plan.name}</h3>
                  <p className="text-2xl font-bold text-brand mt-2">{plan.price} <span className="text-sm font-normal text-slate-500">OMR/mo</span></p>
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <CheckCircle className="w-3 h-3 text-brand mt-0.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {!isSuperAdmin && (
              <p className="text-xs text-slate-400 mt-4">To change your plan, contact support@traveldeskpro.app</p>
            )}
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>Showing {filtered.length} {filtered.length === 1 ? "agency" : "agencies"}</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 rounded hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
