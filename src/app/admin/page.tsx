"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { formatDate, getInitials } from "@/lib/utils";
import {
  Building2,
  CheckCircle,
  XCircle,
  Search,
  Activity,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type AgencyRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "trial" | "suspended";
  created_at: string;
};

export default function AdminPage() {
  const { user, agency } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("agencies");
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isAdmin = user?.role === "owner" || user?.role === "admin";

  useEffect(() => {
    let cancelled = false;
    async function loadAgencies() {
      if (!isAdmin) return;
      setLoading(true);
      setLoadError(null);

      if (!supabase) {
        if (agency && !cancelled) {
          setAgencies([{
            id: agency.id,
            name: agency.name,
            email: agency.email,
            phone: agency.phone,
            plan: agency.plan as AgencyRow["plan"],
            status: agency.status as AgencyRow["status"],
            created_at: agency.createdAt,
          }]);
        }
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("agencies")
        .select("id,name,email,phone,plan,status,created_at")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        setAgencies([]);
      } else {
        setAgencies((data || []) as AgencyRow[]);
      }
      setLoading(false);
    }

    loadAgencies();
    return () => { cancelled = true; };
  }, [agency, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-navy">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-1">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const filtered = agencies.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalAgencies = filtered.length;
  const activeAgencies = filtered.filter((a) => a.status === "active").length;
  const trialAgencies = filtered.filter((a) => a.status === "trial").length;
  const suspendedAgencies = filtered.filter((a) => a.status === "suspended").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("saasAdmin")}</h1>
        <p className="text-slate-500 text-sm mt-1">Manage all agencies and platform settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500">Agencies</p><p className="text-xl font-bold text-navy">{totalAgencies}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><CheckCircle className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500">Active</p><p className="text-xl font-bold text-navy">{activeAgencies}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><Activity className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500">Trial</p><p className="text-xl font-bold text-navy">{trialAgencies}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center"><XCircle className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500">Suspended</p><p className="text-xl font-bold text-navy">{suspendedAgencies}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab("agencies")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "agencies" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              Agencies
            </button>
            <button onClick={() => setActiveTab("audit")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "audit" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              Audit Logs
            </button>
            <button onClick={() => setActiveTab("plans")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "plans" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              Plans
            </button>
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agencies..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
        </div>

        {activeTab === "agencies" && (
          <div className="overflow-x-auto">
            {loadError && (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Could not load agencies: {loadError}
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-medium">Agency</th>
                  <th className="px-4 py-3 text-left font-medium">Plan</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-deep-blue text-white flex items-center justify-center text-xs font-bold">{getInitials(a.name)}</div>
                        <div>
                          <div className="font-medium text-slate-900">{a.name}</div>
                          <div className="text-xs text-slate-500">{a.id} · {a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                        a.plan === "enterprise" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        a.plan === "professional" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      }`}>
                        {a.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{a.phone || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        a.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        a.status === "trial" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {a.status === "active" ? <CheckCircle className="w-3 h-3" /> : a.status === "suspended" ? <XCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No agencies found.</td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">Loading agencies...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="p-4 space-y-3">
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Audit logs are not connected yet.
            </div>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "starter", name: "Starter", price: 30, users: 3, bookings: 300, color: "bg-slate-50" },
              { id: "professional", name: "Professional", price: 40, users: 10, bookings: null, color: "bg-blue-50" },
              { id: "enterprise", name: "Enterprise", price: 150, users: null, bookings: null, color: "bg-purple-50" },
            ].map((plan) => (
              <div key={plan.id} className={`rounded-xl border border-slate-200 p-5 ${plan.color}`}>
                <h3 className="font-bold text-navy">{plan.name}</h3>
                <p className="text-2xl font-bold text-brand mt-2">{plan.price} <span className="text-sm font-normal text-slate-500">OMR/mo</span></p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between"><span>Users</span><span className="font-medium">{plan.users || "Unlimited"}</span></div>
                  <div className="flex items-center justify-between"><span>Bookings</span><span className="font-medium">{plan.bookings ? `${plan.bookings}/mo` : "Unlimited"}</span></div>
                </div>
                <button className="w-full mt-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Edit Plan
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>Showing {filtered.length} agencies</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 rounded hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
