"use client";

import { useMemo, useState } from "react";
import {
  useBookings,
  useInvoices,
  useAgents,
  useCustomers,
} from "@/hooks/useDataStore";
import { useLanguage } from "@/context/LanguageContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportCSV, exportXLSX } from "@/lib/export";
import {
  Download,
  BarChart3,
  Calendar,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  FileText,
  Users,
  DollarSign,
  Briefcase,
} from "lucide-react";
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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ReportsPage() {
  const { t } = useLanguage();
  const { bookings } = useBookings();
  const { invoices } = useInvoices();
  const { agents } = useAgents();
  const { customers } = useCustomers();
  const [exportType, setExportType] = useState<"bookings" | "invoices" | "agents" | "customers">("bookings");
  const currency = "OMR";

  // ── Real stats ──
  const totalRevenue = bookings.reduce((s, b) => s + b.sale_price, 0);
  const totalCost = bookings.reduce((s, b) => s + b.cost_price, 0);
  const netProfit = totalRevenue - totalCost;
  const pendingAmount = invoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((s, i) => s + i.total, 0);

  // ── Last 7 days ──
  const dailyData = useMemo(() => {
    const map: Record<string, { day: string; sales: number; profit: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      map[key] = { day: DAY_NAMES[d.getDay()], sales: 0, profit: 0 };
    }
    bookings.forEach((b) => {
      const key = (b.created_at || "").split("T")[0];
      if (map[key]) {
        map[key].sales += b.sale_price;
        map[key].profit += b.sale_price - b.cost_price;
      }
    });
    return Object.values(map);
  }, [bookings]);

  // ── Last 6 months ──
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; revenue: number; cost: number; profit: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short" });
      map[key] = { month: label, revenue: 0, cost: 0, profit: 0 };
    }
    bookings.forEach((b) => {
      const key = (b.created_at || "").slice(0, 7);
      if (map[key]) {
        map[key].revenue += b.sale_price;
        map[key].cost += b.cost_price;
        map[key].profit += b.sale_price - b.cost_price;
      }
    });
    return Object.values(map);
  }, [bookings]);

  // ── Agent performance ──
  const agentPerformance = useMemo(() => {
    return agents
      .map((a) => {
        const ab = bookings.filter((b) => b.agent_id === a.id);
        const sales = ab.reduce((s, b) => s + b.sale_price, 0);
        const commission = ab.reduce((s, b) => s + (b.sale_price * (b.agent_commission ?? 0)) / 100, 0);
        return { agent: a.name, bookings: ab.length, sales, commission };
      })
      .sort((a, b) => b.sales - a.sales);
  }, [agents, bookings]);

  // ── Pending invoices ──
  const pendingInvoices = useMemo(() => {
    const now = Date.now();
    return invoices
      .filter((i) => i.status === "pending" || i.status === "overdue")
      .map((i) => ({
        invoice: i.invoice_number,
        customer: i.customer_name,
        amount: i.total,
        currency: i.currency,
        dueDate: i.due_date,
        daysOverdue: i.due_date
          ? Math.max(0, Math.floor((now - new Date(i.due_date).getTime()) / 86400000))
          : 0,
      }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [invoices]);

  // ── Export handlers ──
  const handleExportCSV = () => {
    if (exportType === "bookings") {
      exportCSV(
        bookings.map((b) => ({
          ID: b.id,
          Customer: b.customer_name,
          Type: b.type,
          "Sale Price": b.sale_price,
          "Cost Price": b.cost_price,
          Profit: b.sale_price - b.cost_price,
          Status: b.payment_status,
          Date: formatDate(b.created_at),
        })),
        `bookings-report-${new Date().toISOString().split("T")[0]}`
      );
    } else if (exportType === "invoices") {
      exportCSV(
        invoices.map((i) => ({
          "Invoice #": i.invoice_number,
          Customer: i.customer_name,
          Total: i.total,
          Currency: i.currency,
          Status: i.status,
          "Issue Date": i.issued_at,
          "Due Date": i.due_date ?? "",
        })),
        `invoices-report-${new Date().toISOString().split("T")[0]}`
      );
    } else if (exportType === "agents") {
      exportCSV(
        agentPerformance.map((a) => ({
          Agent: a.agent,
          Bookings: a.bookings,
          "Total Sales": a.sales,
          Commission: a.commission,
        })),
        `agents-report-${new Date().toISOString().split("T")[0]}`
      );
    } else {
      exportCSV(
        customers.map((c) => ({
          Name: c.name,
          Phone: c.phone,
          Email: c.email,
          Nationality: c.nationality,
          "Total Bookings": c.total_bookings,
          "Total Spend": c.total_spend,
        })),
        `customers-report-${new Date().toISOString().split("T")[0]}`
      );
    }
  };

  const handleExportXLSX = () => {
    if (exportType === "bookings") {
      exportXLSX(
        bookings.map((b) => ({
          ID: b.id,
          Customer: b.customer_name,
          Type: b.type,
          "Sale Price": b.sale_price,
          "Cost Price": b.cost_price,
          Profit: b.sale_price - b.cost_price,
          Status: b.payment_status,
          Date: formatDate(b.created_at),
        })),
        `bookings-report-${new Date().toISOString().split("T")[0]}`,
        "Bookings"
      );
    } else if (exportType === "invoices") {
      exportXLSX(
        invoices.map((i) => ({
          "Invoice #": i.invoice_number,
          Customer: i.customer_name,
          Total: i.total,
          Currency: i.currency,
          Status: i.status,
          "Issue Date": i.issued_at,
          "Due Date": i.due_date ?? "",
        })),
        `invoices-report-${new Date().toISOString().split("T")[0]}`,
        "Invoices"
      );
    } else if (exportType === "agents") {
      exportXLSX(
        agentPerformance.map((a) => ({
          Agent: a.agent,
          Bookings: a.bookings,
          "Total Sales": a.sales,
          Commission: a.commission,
        })),
        `agents-report-${new Date().toISOString().split("T")[0]}`,
        "Agents"
      );
    } else {
      exportXLSX(
        customers.map((c) => ({
          Name: c.name,
          Phone: c.phone,
          Email: c.email,
          Nationality: c.nationality,
          "Total Bookings": c.total_bookings,
          "Total Spend": c.total_spend,
        })),
        `customers-report-${new Date().toISOString().split("T")[0]}`,
        "Customers"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("reports")}</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time analytics from your data</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value as typeof exportType)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="bookings">Bookings</option>
            <option value="invoices">Invoices</option>
            <option value="agents">Agent Performance</option>
            <option value="customers">Customers</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(totalRevenue, currency), icon: DollarSign, color: "bg-blue-50 text-blue-700" },
          { label: "Net Profit", value: formatCurrency(netProfit, currency), icon: TrendingUp, color: "bg-emerald-50 text-emerald-700" },
          { label: "Pending Payments", value: formatCurrency(pendingAmount, currency), icon: CreditCard, color: "bg-amber-50 text-amber-700" },
          { label: "Total Bookings", value: bookings.length.toString(), icon: Briefcase, color: "bg-purple-50 text-purple-700" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-xl font-bold text-navy">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {t("dailySales")}
            </h3>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: number) => formatCurrency(v, currency)} />
              <Bar dataKey="sales" name="Sales" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={22} />
              <Bar dataKey="profit" name="Profit" fill="#10B981" radius={[4, 4, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
          {bookings.length === 0 && (
            <p className="text-center text-xs text-slate-400 mt-2">No booking data yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy flex items-center gap-2">
              <FileText className="w-4 h-4" /> {t("monthlyReport")}
            </h3>
            <span className="text-xs text-slate-500">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: number) => formatCurrency(v, currency)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2563EB" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cost" name="Cost" stroke="#94a3b8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          {bookings.length === 0 && (
            <p className="text-center text-xs text-slate-400 mt-2">No booking data yet</p>
          )}
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-navy flex items-center gap-2">
            <Users className="w-4 h-4" /> {t("agentPerformance")}
          </h3>
          <span className="text-xs text-slate-500">{agents.length} agents total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">Agent</th>
                <th className="px-5 py-3 text-left font-medium">Bookings</th>
                <th className="px-5 py-3 text-left font-medium">Total Sales</th>
                <th className="px-5 py-3 text-left font-medium">Commission Earned</th>
                <th className="px-5 py-3 text-left font-medium">Performance</th>
              </tr>
            </thead>
            <tbody>
              {agentPerformance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">No agents yet</td>
                </tr>
              ) : (
                agentPerformance.map((a, i) => {
                  const maxSales = Math.max(...agentPerformance.map((x) => x.sales), 1);
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-900">{a.agent}</td>
                      <td className="px-5 py-3 text-slate-900">{a.bookings}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{formatCurrency(a.sales, currency)}</td>
                      <td className="px-5 py-3 font-medium text-brand">{formatCurrency(a.commission, currency)}</td>
                      <td className="px-5 py-3 w-32">
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-brand h-2 rounded-full transition-all" style={{ width: `${Math.min((a.sales / maxSales) * 100, 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Payments */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-navy">Pending Payments Report</h3>
          <span className="ml-auto text-xs text-slate-500">{pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? "s" : ""}</span>
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
              {pendingInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-emerald-600 text-sm font-medium">
                    No pending payments
                  </td>
                </tr>
              ) : (
                pendingInvoices.map((inv, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900">{inv.invoice}</td>
                    <td className="px-5 py-3 text-slate-900">{inv.customer}</td>
                    <td className="px-5 py-3 font-medium text-amber-600">{formatCurrency(inv.amount, inv.currency)}</td>
                    <td className="px-5 py-3 text-slate-500">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                    <td className={`px-5 py-3 font-medium ${inv.daysOverdue > 0 ? "text-red-600" : "text-slate-500"}`}>
                      {inv.daysOverdue > 0 ? `${inv.daysOverdue} day${inv.daysOverdue !== 1 ? "s" : ""}` : "Today"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
