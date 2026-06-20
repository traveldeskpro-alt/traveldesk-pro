"use client";

import React, { useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAgents, useBookings, useInvoices } from "@/hooks/useDataStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, BarChart3, Calendar, TrendingUp, CreditCard, AlertTriangle, FileText, Users } from "lucide-react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
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

const reportPdfStyles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#0f172a" },
  title: { fontSize: 18, marginBottom: 6, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#64748b", marginBottom: 18 },
  section: { marginTop: 16 },
  heading: { fontSize: 13, marginBottom: 8, fontWeight: 700 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 6 },
  cell: { flex: 1 },
  label: { color: "#64748b" },
});

type ReportSummary = {
  totalSales: number;
  totalProfit: number;
  pendingAmount: number;
  agentCount: number;
};

function safeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function ReportPdfDocument({
  summary,
  agentPerformance,
  pendingInvoices,
  currency,
}: {
  summary: ReportSummary;
  agentPerformance: Array<{ agent: string; bookings: number; sales: number; commission: number }>;
  pendingInvoices: Array<{ invoice_number: string; customer_name: string; total: number; due_date: string }>;
  currency: string;
}) {
  return (
    <Document>
      <Page size="A4" style={reportPdfStyles.page}>
        <Text style={reportPdfStyles.title}>Reports</Text>
        <Text style={reportPdfStyles.subtitle}>Real tenant data exported from TravelDesk Pro</Text>

        <View style={reportPdfStyles.section}>
          <Text style={reportPdfStyles.heading}>Summary</Text>
          <View style={reportPdfStyles.row}><Text style={reportPdfStyles.cell}>Sales</Text><Text style={reportPdfStyles.cell}>{formatCurrency(summary.totalSales, currency)}</Text></View>
          <View style={reportPdfStyles.row}><Text style={reportPdfStyles.cell}>Profit</Text><Text style={reportPdfStyles.cell}>{formatCurrency(summary.totalProfit, currency)}</Text></View>
          <View style={reportPdfStyles.row}><Text style={reportPdfStyles.cell}>Pending</Text><Text style={reportPdfStyles.cell}>{formatCurrency(summary.pendingAmount, currency)}</Text></View>
          <View style={reportPdfStyles.row}><Text style={reportPdfStyles.cell}>Agents</Text><Text style={reportPdfStyles.cell}>{summary.agentCount}</Text></View>
        </View>

        <View style={reportPdfStyles.section}>
          <Text style={reportPdfStyles.heading}>Agent Performance</Text>
          {agentPerformance.length === 0 ? (
            <Text style={reportPdfStyles.label}>No agent data.</Text>
          ) : agentPerformance.map((a) => (
            <View key={a.agent} style={reportPdfStyles.row}>
              <Text style={reportPdfStyles.cell}>{a.agent}</Text>
              <Text style={reportPdfStyles.cell}>{a.bookings} bookings</Text>
              <Text style={reportPdfStyles.cell}>{formatCurrency(a.sales, currency)}</Text>
              <Text style={reportPdfStyles.cell}>{formatCurrency(a.commission, currency)}</Text>
            </View>
          ))}
        </View>

        <View style={reportPdfStyles.section}>
          <Text style={reportPdfStyles.heading}>Pending Payments</Text>
          {pendingInvoices.length === 0 ? (
            <Text style={reportPdfStyles.label}>No pending invoices.</Text>
          ) : pendingInvoices.map((invoice) => (
            <View key={invoice.invoice_number} style={reportPdfStyles.row}>
              <Text style={reportPdfStyles.cell}>{invoice.invoice_number}</Text>
              <Text style={reportPdfStyles.cell}>{invoice.customer_name}</Text>
              <Text style={reportPdfStyles.cell}>{formatCurrency(invoice.total, currency)}</Text>
              <Text style={reportPdfStyles.cell}>{formatDate(invoice.due_date)}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export default function ReportsPage() {
  const { t } = useLanguage();
  const { bookings } = useBookings();
  const { invoices } = useInvoices();
  const { agents } = useAgents();
  const [exportingPdf, setExportingPdf] = useState(false);
  const currency = "OMR";
  const now = new Date();

  const dailyData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      const dayBookings = bookings.filter((booking) => {
        const bookingDate = safeDate(booking.created_at);
        return bookingDate?.toDateString() === day.toDateString();
      });
      const sales = dayBookings.reduce((sum, booking) => sum + booking.sale_price, 0);
      const cost = dayBookings.reduce((sum, booking) => sum + booking.cost_price, 0);
      return {
        day: day.toLocaleDateString("en", { weekday: "short" }),
        sales,
        profit: sales - cost,
      };
    });
  }, [bookings]);

  const monthlyData = useMemo(() => {
    return Array.from({ length: now.getMonth() + 1 }).map((_, month) => {
      const monthBookings = bookings.filter((booking) => {
        const bookingDate = safeDate(booking.created_at);
        return bookingDate?.getFullYear() === now.getFullYear() && bookingDate.getMonth() === month;
      });
      const revenue = monthBookings.reduce((sum, booking) => sum + booking.sale_price, 0);
      const cost = monthBookings.reduce((sum, booking) => sum + booking.cost_price, 0);
      return {
        month: new Date(now.getFullYear(), month, 1).toLocaleDateString("en", { month: "short" }),
        revenue,
        cost,
        profit: revenue - cost,
      };
    });
  }, [bookings]);

  const agentPerformance = useMemo(() => {
    return agents.map((agent) => {
      const agentBookings = bookings.filter((booking) => booking.agent_id === agent.id);
      const sales = agentBookings.reduce((sum, booking) => sum + booking.sale_price, 0);
      return {
        agent: agent.name,
        bookings: agentBookings.length,
        sales,
        commission: agentBookings.reduce((sum, booking) => sum + (booking.sale_price * agent.commission_rate) / 100, 0),
      };
    });
  }, [agents, bookings]);

  const pendingInvoices = useMemo(() => {
    return invoices
      .filter((invoice) => invoice.status === "pending" || invoice.status === "overdue")
      .sort((a, b) => (safeDate(a.due_date)?.getTime() || 0) - (safeDate(b.due_date)?.getTime() || 0));
  }, [invoices]);

  const summary = useMemo<ReportSummary>(() => {
    const totalSales = bookings.reduce((sum, booking) => sum + booking.sale_price, 0);
    const totalCost = bookings.reduce((sum, booking) => sum + booking.cost_price, 0);
    return {
      totalSales,
      totalProfit: totalSales - totalCost,
      pendingAmount: pendingInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
      agentCount: agents.length,
    };
  }, [agents.length, bookings, pendingInvoices]);

  const hasReportData = bookings.length > 0 || invoices.length > 0 || agents.length > 0;
  const exportDisabledTitle = "Exports are disabled until this tenant has report data.";

  const exportCsv = () => {
    const rows = [
      ["Section", "Name", "Bookings", "Sales", "Commission", "Amount", "Due Date"],
      ...agentPerformance.map((a) => ["Agent Performance", a.agent, a.bookings, a.sales, a.commission, "", ""]),
      ...pendingInvoices.map((invoice) => ["Pending Payment", invoice.invoice_number, "", "", "", invoice.total, invoice.due_date]),
    ];
    const csv = rows.map((row) => row.map((cell) => csvCell(cell)).join(",")).join("\n");
    downloadFile(new Blob([csv], { type: "text/csv;charset=utf-8" }), "reports.csv");
  };

  const exportExcel = () => {
    const tableRows = [
      ["Type", "Name", "Bookings", "Sales", "Commission", "Amount", "Due Date"],
      ...agentPerformance.map((a) => ["Agent Performance", a.agent, a.bookings, a.sales, a.commission, "", ""]),
      ...pendingInvoices.map((invoice) => ["Pending Payment", invoice.invoice_number, "", "", "", invoice.total, formatDate(invoice.due_date)]),
    ];
    const html = `<table>${tableRows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell)}</td>`).join("")}</tr>`).join("")}</table>`;
    downloadFile(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }), "reports.xls");
  };

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      const blob = await pdf(
        <ReportPdfDocument
          summary={summary}
          agentPerformance={agentPerformance}
          pendingInvoices={pendingInvoices}
          currency={currency}
        />
      ).toBlob();
      downloadFile(blob, "reports.pdf");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">{t("reports")}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} disabled={!hasReportData} title={!hasReportData ? exportDisabledTitle : "Download Excel file"} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={exportPdf} disabled={!hasReportData || exportingPdf} title={!hasReportData ? exportDisabledTitle : "Download PDF file"} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Download className="w-4 h-4" /> {exportingPdf ? "Exporting PDF..." : "Export PDF"}
          </button>
          <button onClick={exportCsv} disabled={!hasReportData} title={!hasReportData ? exportDisabledTitle : "Download CSV file"} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center"><BarChart3 className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("dailySales")}</p>
            <p className="text-xl font-bold text-navy dark:text-white">{formatCurrency(summary.totalSales, currency)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("profitLoss")}</p>
            <p className="text-xl font-bold text-navy dark:text-white">{formatCurrency(summary.totalProfit, currency)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center"><CreditCard className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("pending")}</p>
            <p className="text-xl font-bold text-navy dark:text-white">{formatCurrency(summary.pendingAmount, currency)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 flex items-center justify-center"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("agentPerformance")}</p>
            <p className="text-xl font-bold text-navy dark:text-white">{summary.agentCount} agents</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy dark:text-white flex items-center gap-2"><Calendar className="w-4 h-4" /> {t("dailySales")}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Last 7 days</span>
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

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy dark:text-white flex items-center gap-2"><FileText className="w-4 h-4" /> {t("monthlyReport")}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">YTD {now.getFullYear()}</span>
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

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-navy dark:text-white flex items-center gap-2"><Users className="w-4 h-4" /> {t("agentPerformance")}</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">This month</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">{t("name")}</th>
                <th className="px-5 py-3 text-left font-medium">{t("bookingCount")}</th>
                <th className="px-5 py-3 text-left font-medium">{t("totalSpend")}</th>
                <th className="px-5 py-3 text-left font-medium">{t("commission")}</th>
                <th className="px-5 py-3 text-left font-medium">{t("performance")}</th>
              </tr>
            </thead>
            <tbody>
              {agentPerformance.map((a) => (
                <tr key={a.agent} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{a.agent}</td>
                  <td className="px-5 py-3 text-slate-900 dark:text-white">{a.bookings}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{formatCurrency(a.sales, currency)}</td>
                  <td className="px-5 py-3 font-medium text-brand">{formatCurrency(a.commission, currency)}</td>
                  <td className="px-5 py-3">
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-brand h-2 rounded-full" style={{ width: `${Math.min((a.sales / 15000) * 100, 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
              {agentPerformance.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No agent performance data yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-navy dark:text-white">Pending Payments Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">Invoice</th>
                <th className="px-5 py-3 text-left font-medium">Customer</th>
                <th className="px-5 py-3 text-left font-medium">Amount</th>
                <th className="px-5 py-3 text-left font-medium">Due Date</th>
                <th className="px-5 py-3 text-left font-medium">Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvoices.map((invoice) => {
                const dueDate = safeDate(invoice.due_date);
                const daysOverdue = dueDate ? Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86400000)) : 0;
                return (
                  <tr key={invoice.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{invoice.invoice_number}</td>
                    <td className="px-5 py-3 text-slate-900 dark:text-white">{invoice.customer_name}</td>
                    <td className="px-5 py-3 font-medium text-amber-600">{formatCurrency(invoice.total, currency)}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatDate(invoice.due_date)}</td>
                    <td className="px-5 py-3 text-red-600 font-medium">{daysOverdue > 0 ? `${daysOverdue} days` : "Not overdue"}</td>
                  </tr>
                );
              })}
              {pendingInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No pending invoices.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
