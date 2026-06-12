"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import {
  Building2,
  Users,
  CreditCard,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  ArrowUpRight,
  TrendingUp,
  Activity,
  DollarSign,
  FileText,
  RefreshCw,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const mockAgencies = [
  { id: "AG-001", name: "TravelDesk Pro Demo Agency", email: "demo@traveldeskpro.app", phone: "+968 1234 5678", plan: "professional", status: "active", users: 8, bookings: 342, revenue: 85400, createdAt: "2023-01-15" },
  { id: "AG-002", name: "Muscat Holidays", email: "hello@muscat.om", phone: "+968 8765 4321", plan: "starter", status: "active", users: 3, bookings: 98, revenue: 24100, createdAt: "2023-04-10" },
  { id: "AG-003", name: "Desert Rose Tours", email: "contact@desertrose.om", phone: "+968 9999 0000", plan: "enterprise", status: "suspended", users: 15, bookings: 1200, revenue: 312000, createdAt: "2022-11-20" },
  { id: "AG-004", name: "Pearl Travel", email: "book@pearl.om", phone: "+968 7777 8888", plan: "professional", status: "trial", users: 6, bookings: 210, revenue: 56700, createdAt: "2024-02-01" },
  { id: "AG-005", name: "Oman Express", email: "support@omanexpress.om", phone: "+968 6666 5555", plan: "starter", status: "active", users: 2, bookings: 45, revenue: 11200, createdAt: "2024-05-15" },
];

const auditLogs = [
  { id: 1, user: "System", action: "Agency AG-003 suspended", entity: "Desert Rose Tours", time: "2 hours ago", type: "warning" },
  { id: 2, user: "Admin", action: "New plan assigned", entity: "Muscat Holidays → Professional", time: "5 hours ago", type: "success" },
  { id: 3, user: "System", action: "Payment failed", entity: "Pearl Travel", time: "1 day ago", type: "error" },
  { id: 4, user: "Admin", action: "Agency created", entity: "Oman Express", time: "2 days ago", type: "success" },
  { id: 5, user: "System", action: "Backup completed", entity: "All agencies", time: "3 days ago", type: "info" },
];

export default function AdminPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("agencies");

  const isAdmin = user?.role === "owner" || user?.role === "admin";

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

  const filtered = mockAgencies.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filtered.reduce((a, b) => a + b.revenue, 0);
  const totalAgencies = filtered.length;
  const totalUsers = filtered.reduce((a, b) => a + b.users, 0);
  const totalBookings = filtered.reduce((a, b) => a + b.bookings, 0);

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
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center"><Users className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500">Total Users</p><p className="text-xl font-bold text-navy">{totalUsers}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500">Total Bookings</p><p className="text-xl font-bold text-navy">{totalBookings.toLocaleString()}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500">Total Revenue</p><p className="text-xl font-bold text-navy">{formatCurrency(totalRevenue, "OMR")}</p></div>
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-medium">Agency</th>
                  <th className="px-4 py-3 text-left font-medium">Plan</th>
                  <th className="px-4 py-3 text-left font-medium">Users</th>
                  <th className="px-4 py-3 text-left font-medium">Bookings</th>
                  <th className="px-4 py-3 text-left font-medium">Revenue</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
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
                    <td className="px-4 py-3 text-slate-700">{a.users}</td>
                    <td className="px-4 py-3 text-slate-700">{a.bookings.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(a.revenue, "OMR")}</td>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Reset"><RefreshCw className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Edit"><FileText className="w-4 h-4" /></button>
                        {a.status === "active" ? (
                          <button className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Suspend"><XCircle className="w-4 h-4" /></button>
                        ) : (
                          <button className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600" title="Activate"><CheckCircle className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="p-4 space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  log.type === "warning" ? "bg-amber-50 text-amber-700" :
                  log.type === "error" ? "bg-red-50 text-red-700" :
                  log.type === "success" ? "bg-emerald-50 text-emerald-700" :
                  "bg-blue-50 text-blue-700"
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{log.action}</p>
                  <p className="text-xs text-slate-500">{log.entity} · by {log.user}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{log.time}</span>
              </div>
            ))}
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
