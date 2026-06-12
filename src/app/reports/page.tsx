"use client";

import { useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import { Download, BarChart3, Calendar, TrendingUp, CreditCard, AlertTriangle, FileText, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

const dailyData = [
  { day: "Mon", sales: 1200, profit: 320 },
  { day: "Tue", sales: 1800, profit: 480 },
  { day: "Wed", sales: 900, profit: 210 },
  { day: "Thu", sales: 2100, profit: 620 },
  { day: "Fri", sales: 1600, profit: 410 },
  { day: "Sat", sales: 2400, profit: 780 },
  { day: "Sun", sales: 1100, profit: 290 },
];

const monthlyData = [
  { month: "Jan", revenue: 42000, cost: 31000, profit: 11000 },
  { month: "Feb", revenue: 58000, cost: 41000, profit: 17000 },
  { month: "Mar", revenue: 39000, cost: 28000, profit: 11000 },
  { month: "Apr", revenue: 72000, cost: 51000, profit: 21000 },
  { month: "May", revenue: 61000, cost: 43000, profit: 18000 },
  { month: "Jun", revenue: 85000, cost: 59000, profit: 26000 },
];

const agentPerformance = [
  { agent: "Omar", bookings: 34, sales: 12400, commission: 620 },
  { agent: "Aisha", bookings: 28, sales: 9800, commission: 490 },
  { agent: "Khalid", bookings: 22, sales: 8500, commission: 425 },
  { agent: "Sara", bookings: 12, sales: 4200, commission: 252 },
];

export default function ReportsPage() {
  const { t } = useLanguage();
  const currency = "OMR";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("reports")}</h1>
          <p className="text-slate-500 text-sm mt-1">Analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> {t("exportExcel")}
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> {t("exportPDF")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><BarChart3 className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500">{t("dailySales")}</p>
            <p className="text-xl font-bold text-navy">{formatCurrency(11100, currency)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500">{t("profitLoss")}</p>
            <p className="text-xl font-bold text-navy">{formatCurrency(3110, currency)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><CreditCard className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500">{t("pending")}</p>
            <p className="text-xl font-bold text-navy">{formatCurrency(12400, currency)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500">{t("agentPerformance")}</p>
            <p className="text-xl font-bold text-navy">{agentPerformance.length} agents</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy flex items-center gap-2"><Calendar className="w-4 h-4" /> {t("dailySales")}</h3>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: any) => formatCurrency(v, currency)} />
              <Bar dataKey="sales" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy flex items-center gap-2"><FileText className="w-4 h-4" /> {t("monthlyReport")}</h3>
            <span className="text-xs text-slate-500">YTD 2024</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: any) => formatCurrency(v, currency)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cost" stroke="#94a3b8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-navy flex items-center gap-2"><Users className="w-4 h-4" /> {t("agentPerformance")}</h3>
          <span className="text-xs text-slate-500">This month</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">{t("name")}</th>
                <th className="px-5 py-3 text-left font-medium">{t("bookingCount")}</th>
                <th className="px-5 py-3 text-left font-medium">{t("totalSpend")}</th>
                <th className="px-5 py-3 text-left font-medium">{t("commission")}</th>
                <th className="px-5 py-3 text-left font-medium">{t("performance")}</th>
              </tr>
            </thead>
            <tbody>
              {agentPerformance.map((a, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{a.agent}</td>
                  <td className="px-5 py-3 text-slate-900">{a.bookings}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{formatCurrency(a.sales, currency)}</td>
                  <td className="px-5 py-3 font-medium text-brand">{formatCurrency(a.commission, currency)}</td>
                  <td className="px-5 py-3">
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-brand h-2 rounded-full" style={{ width: `${Math.min((a.sales / 15000) * 100, 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-navy">Pending Payments Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">Invoice</th>
                <th className="px-5 py-3 text-left font-medium">Customer</th>
                <th className="px-5 py-3 text-left font-medium">Amount</th>
                <th className="px-5 py-3 text-left font-medium">Due Date</th>
                <th className="px-5 py-3 text-left font-medium">Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">INV-1026</td>
                <td className="px-5 py-3 text-slate-900">Khalid Al-Busaidi</td>
                <td className="px-5 py-3 font-medium text-amber-600">{formatCurrency(480, currency)}</td>
                <td className="px-5 py-3 text-slate-500">2024-06-13</td>
                <td className="px-5 py-3 text-red-600 font-medium">3 days</td>
              </tr>
              <tr className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">INV-1027</td>
                <td className="px-5 py-3 text-slate-900">Mariam Al-Riyami</td>
                <td className="px-5 py-3 font-medium text-amber-600">{formatCurrency(1500, currency)}</td>
                <td className="px-5 py-3 text-slate-500">2024-06-12</td>
                <td className="px-5 py-3 text-red-600 font-medium">4 days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
