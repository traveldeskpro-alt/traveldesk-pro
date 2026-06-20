'use client';

import React, { useState, useMemo } from 'react';
import { useInvoices, InvoiceItem, useInvoiceSettings, useAgencyBranding, useCustomers, generateInvoiceNumber } from '@/hooks/useDataStore';
import { usePermissions } from '@/hooks/useDataStore';
import { useAuth } from '@/context/AuthContext';
import { useDataMode } from '@/context/DataModeContext';
import { Search, Plus, X, Save, Printer, Download, MessageCircle, Trash2, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Send, Smartphone } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CURRENCIES, getCurrencySymbol, INVOICE_STATUS_COLORS, WHATSAPP_TEMPLATES } from '@/lib/constants';
import { generateInvoicePDF } from '@/components/invoice/InvoicePDF';
import { openWhatsAppWeb, buildMessage, getInvoiceWhatsAppVars } from '@/lib/whatsapp';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';

function toDateInputValue(date: Date) {
  return date.toISOString().split('T')[0];
}

function getDefaultDueDate() {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  return toDateInputValue(dueDate);
}

function parseDateInput(value: string, fieldName: string) {
  if (!value) {
    throw new Error(`${fieldName} is required.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return parsed;
}

export default function InvoicesPage() {
  const { invoices, loading, create, updateStatus, remove } = useInvoices();
  const { can } = usePermissions();
  const { user, agency } = useAuth();
  const { useLocalStorage } = useDataMode();
  const { settings: invoiceSettings, generateNumber } = useInvoiceSettings();
  const { branding } = useAgencyBranding();
  const { customers } = useCustomers();

  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<typeof invoices[0] | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState<typeof invoices[0] | null>(null);
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_id: '',
    customer_name: '',
    customer_passport: '',
    customer_phone: '',
    customer_email: '',
    customer_nationality: '',
    invoice_number: '',
    prefix: invoiceSettings.prefix,
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }] as InvoiceItem[],
    subtotal: 0,
    tax_enabled: invoiceSettings.taxEnabled,
    tax_percentage: invoiceSettings.taxPercentage,
    tax: 0,
    total: 0,
    currency: invoiceSettings.defaultCurrency,
    status: 'pending' as 'paid' | 'pending' | 'refund' | 'overdue',
    issued_at: toDateInputValue(new Date()),
    due_date: getDefaultDueDate(),
    notes: invoiceSettings.defaultNotes,
  });

  const recalc = (draft: typeof form) => {
    const subtotal = draft.items.reduce((s, i) => s + i.total, 0);
    const tax = draft.tax_enabled ? subtotal * (draft.tax_percentage / 100) : 0;
    return { ...draft, subtotal, tax, total: subtotal + tax };
  };

  const addItem = () => {
    setForm((prev) => recalc({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }],
    }));
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    setForm((prev) => {
      const items = prev.items.map((item, i) => {
        if (i !== idx) return item;
        const next = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          next.total = (next.quantity || 0) * (next.unit_price || 0);
        }
        return next;
      });
      return recalc({ ...prev, items });
    });
  };

  const removeItem = (idx: number) => {
    setForm((prev) => recalc({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleCustomerSelect = (customerId: string) => {
    const c = customers.find((x) => x.id === customerId);
    if (!c) return;
    setForm((prev) => ({
      ...prev,
      customer_id: c.id,
      customer_name: c.name,
      customer_phone: c.phone || '',
      customer_email: c.email || '',
      customer_passport: c.passport_number || '',
      customer_nationality: c.nationality || '',
    }));
  };

  const openCreate = async () => {
    setSaveError(null);
    let num: string;
    try {
      num = await generateInvoiceNumber(
        user?.agencyId ?? '',
        invoiceSettings.prefix,
        useLocalStorage,
        generateNumber,
      );
    } catch {
      num = generateNumber();
    }
    setForm({
      customer_id: '',
      customer_name: '',
      customer_passport: '',
      customer_phone: '',
      customer_email: '',
      customer_nationality: '',
      invoice_number: num,
      prefix: invoiceSettings.prefix,
      items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
      subtotal: 0,
      tax_enabled: invoiceSettings.taxEnabled,
      tax_percentage: invoiceSettings.taxPercentage,
      tax: 0,
      total: 0,
      currency: invoiceSettings.defaultCurrency,
      status: 'pending',
      issued_at: toDateInputValue(new Date()),
      due_date: getDefaultDueDate(),
      notes: invoiceSettings.defaultNotes,
    });
    setShowModal(true);
  };

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const handleSave = async () => {
    setSaveError(null);

    if (!form.customer_id) {
      setSaveError('Please select a customer from the dropdown before saving.');
      return;
    }
    if (!useLocalStorage && !UUID_RE.test(form.customer_id)) {
      setSaveError('Please select a valid customer from the dropdown before saving.');
      return;
    }
    if (!user?.agencyId || (!useLocalStorage && !UUID_RE.test(user.agencyId))) {
      setSaveError('Your agency account is not properly set up. Please log out and log in again.');
      return;
    }
    if (!form.invoice_number || form.total <= 0) {
      setSaveError('Invoice number and a positive total are required.');
      return;
    }

    setSaving(true);
    try {
      const issuedAt = parseDateInput(form.issued_at, 'Issue date');
      const dueDate = parseDateInput(form.due_date, 'Due date');
      if (dueDate < issuedAt) {
        throw new Error('Due date cannot be before the issue date.');
      }

      await create({
        customer_id: form.customer_id,
        customer_name: form.customer_name,
        customer_passport: form.customer_passport,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email,
        customer_nationality: form.customer_nationality,
        invoice_number: form.invoice_number,
        prefix: form.prefix,
        sequence: parseInt(form.invoice_number.split('-').pop() || '0'),
        items: form.items,
        subtotal: form.subtotal,
        tax_enabled: form.tax_enabled,
        tax_percentage: form.tax_percentage,
        tax: form.tax,
        total: form.total,
        currency: form.currency,
        status: form.status,
        issued_at: issuedAt.toISOString(),
        due_date: dueDate.toISOString(),
        notes: form.notes,
        agency_branding: {
          logo_url: branding.logoUrl || agency?.logoUrl,
          name: branding.name || agency?.name,
          address: branding.address || agency?.address,
          phone: branding.phone || agency?.phone,
          email: branding.email || agency?.email,
          website: branding.website,
          cr_number: branding.crNumber,
          vat_number: branding.vatNumber,
          bank_name: branding.bankName,
          account_name: branding.accountName,
          account_number: branding.accountNumber,
          iban: branding.iban,
          swift_code: branding.swiftCode,
        },
      });
      setShowModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.message ?? 'Failed to save invoice. Please try again.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this invoice? This cannot be undone.')) remove(id);
  };

  const handleStatus = (id: string, status: typeof form.status) => {
    updateStatus(id, status);
  };

  const getPdfBranding = (invoice: typeof invoices[0]) => ({
    ...branding,
    logoUrl: invoice.agency_branding?.logo_url || branding.logoUrl || agency?.logoUrl || '',
    name: invoice.agency_branding?.name || branding.name || agency?.name || 'TravelDesk Pro',
    address: invoice.agency_branding?.address || branding.address || agency?.address || '',
    phone: invoice.agency_branding?.phone || branding.phone || agency?.phone || '',
    email: invoice.agency_branding?.email || branding.email || agency?.email || '',
    website: invoice.agency_branding?.website || branding.website || '',
    crNumber: invoice.agency_branding?.cr_number || branding.crNumber || '',
    vatNumber: invoice.agency_branding?.vat_number || branding.vatNumber || '',
    bankName: invoice.agency_branding?.bank_name || branding.bankName || '',
    accountName: invoice.agency_branding?.account_name || branding.accountName || '',
    accountNumber: invoice.agency_branding?.account_number || branding.accountNumber || '',
    iban: invoice.agency_branding?.iban || branding.iban || '',
    swiftCode: invoice.agency_branding?.swift_code || branding.swiftCode || '',
  });

  const downloadInvoicePdf = async (invoice: typeof invoices[0]) => {
    setDownloadingInvoiceId(invoice.id);
    try {
      const blob = await generateInvoicePDF(invoice, getPdfBranding(invoice));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate invoice PDF.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const filtered = useMemo(() => {
    let data = invoices.filter((i) =>
      i.customer_name.toLowerCase().includes(query.toLowerCase()) ||
      i.invoice_number.toLowerCase().includes(query.toLowerCase()) ||
      i.status.toLowerCase().includes(query.toLowerCase())
    );
    if (sortConfig) {
      data = [...data].sort((a, b) => {
        const aVal = (a as any)[sortConfig.key] ?? '';
        const bVal = (b as any)[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [invoices, query, sortConfig]);

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.total, 0);
  const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.total, 0);
  const totalInvoices = invoices.length;

  const toggleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const sendWhatsApp = (type: keyof typeof WHATSAPP_TEMPLATES) => {
    if (!showWhatsApp) return;
    const vars = getInvoiceWhatsAppVars(showWhatsApp, branding);
    const { body } = buildMessage(type, vars);
    const phone = showWhatsApp.customer_phone || '';
    if (!phone) { alert('Customer phone number is required'); return; }
    openWhatsAppWeb(phone, body);
    setShowWhatsApp(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create, manage, and send professional invoices</p>
        </div>
        {can('create') && (
          <Button variant="primary" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Create Invoice
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-600">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A] dark:text-white">{totalInvoices}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Invoices</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A] dark:text-white">{formatCurrency(totalPaid, 'OMR')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Paid</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A] dark:text-white">{formatCurrency(totalPending, 'OMR')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A] dark:text-white">{formatCurrency(totalOverdue, 'OMR')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overdue</p>
          </div>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by invoice number, customer name, or status..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#0F172A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm"
        />
      </div>

      {invoices.length === 0 && (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/50">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-600">
            <Printer className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">No invoices yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Create your first invoice to send to customers. It takes less than 60 seconds.
          </p>
          {can('create') && (
            <Button variant="primary" className="mt-5 gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Create First Invoice
            </Button>
          )}
        </div>
      )}

      {invoices.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" onClick={() => toggleSort('invoice_number')}>
                    <span className="flex items-center gap-1">Invoice # {sortConfig?.key === 'invoice_number' && (sortConfig.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((inv) => {
                  const colors = INVOICE_STATUS_COLORS[inv.status];
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#0F172A] dark:text-white text-sm">{inv.invoice_number}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{inv.prefix}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#0F172A] dark:text-white">{inv.customer_name}</td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(inv.issued_at)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-[#0F172A] dark:text-white text-sm">
                        {getCurrencySymbol(inv.currency)} {inv.total.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setShowDetail(inv)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-brand transition-colors" title="View & Download">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => setShowWhatsApp(inv)} className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors" title="Open WhatsApp Web">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleStatus(inv.id, inv.status === 'paid' ? 'pending' : 'paid')} className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors" title={inv.status === 'paid' ? 'Mark Pending' : 'Mark Paid'}>
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          {can('delete') && (
                            <button onClick={() => handleDelete(inv.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">No invoices match your search.</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">Create Invoice</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Prefix</label>
                  <input
                    value={form.prefix}
                    onChange={(e) => setForm((prev) => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Invoice Number</label>
                  <input
                    value={form.invoice_number}
                    readOnly
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Issue Date</label>
                  <DatePicker value={form.issued_at} onChange={(v) => setForm((prev) => ({ ...prev, issued_at: v }))} placeholder="Select date" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Due Date</label>
                  <DatePicker value={form.due_date} onChange={(v) => setForm((prev) => ({ ...prev, due_date: v }))} placeholder="Select date" />
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-800/30">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Customer</label>
                <select
                  value={form.customer_id}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand mb-3"
                >
                  <option value="">Select a customer or type below...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Customer Name *" value={form.customer_name} onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" required />
                  <input placeholder="Phone" value={form.customer_phone} onChange={(e) => setForm((prev) => ({ ...prev, customer_phone: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  <input placeholder="Email" value={form.customer_email} onChange={(e) => setForm((prev) => ({ ...prev, customer_email: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  <input placeholder="Passport Number" value={form.customer_passport} onChange={(e) => setForm((prev) => ({ ...prev, customer_passport: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  <input placeholder="Nationality" value={form.customer_nationality} onChange={(e) => setForm((prev) => ({ ...prev, customer_nationality: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand sm:col-span-2" />
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Items</h3>
                  <button onClick={addItem} className="text-sm text-brand font-medium hover:text-brand/80 transition-colors">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 p-2">
                      <div className="col-span-5">
                        <input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Description" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} placeholder="Qty" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-center" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" min={0} step={0.01} value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))} placeholder="Unit Price" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#0F172A] dark:text-white">{getCurrencySymbol(form.currency)} {item.total.toFixed(2)}</span>
                        {form.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                    {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    <input
                      type="checkbox"
                      checked={form.tax_enabled}
                      onChange={(e) => setForm((prev) => recalc({ ...prev, tax_enabled: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-brand focus:ring-brand"
                    />
                    Enable Tax
                  </label>
                  {form.tax_enabled && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={form.tax_percentage}
                        onChange={(e) => setForm((prev) => recalc({ ...prev, tax_percentage: Number(e.target.value) }))}
                        className="w-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-sm text-slate-500 dark:text-slate-400">%</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as any }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-800/30">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Subtotal</span>
                  <span className="text-sm font-medium text-[#0F172A] dark:text-white">{getCurrencySymbol(form.currency)} {form.subtotal.toFixed(2)}</span>
                </div>
                {form.tax_enabled && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Tax ({form.tax_percentage}%)</span>
                    <span className="text-sm font-medium text-[#0F172A] dark:text-white">{getCurrencySymbol(form.currency)} {form.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 mt-1">
                  <span className="text-base font-bold text-[#0F172A] dark:text-white">Grand Total</span>
                  <span className="text-xl font-bold text-[#2563EB]">{getCurrencySymbol(form.currency)} {form.total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Thank you for choosing our services. Payment terms: 30 days."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                />
              </div>

              {(branding.bankName || branding.iban) && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-800/30">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Payment Information (from Agency Branding)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600 dark:text-slate-300">
                    {branding.bankName && <div><span className="text-slate-400">Bank:</span> {branding.bankName}</div>}
                    {branding.accountName && <div><span className="text-slate-400">Account Name:</span> {branding.accountName}</div>}
                    {branding.accountNumber && <div><span className="text-slate-400">Account #:</span> {branding.accountNumber}</div>}
                    {branding.iban && <div><span className="text-slate-400">IBAN:</span> {branding.iban}</div>}
                    {branding.swiftCode && <div><span className="text-slate-400">SWIFT:</span> {branding.swiftCode}</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 space-y-3">
              {saveError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                  <span>{saveError}</span>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} className="gap-2" disabled={saving}>
                  <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Invoice'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetail(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#0F172A]">Invoice {showDetail.invoice_number}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadInvoicePdf(showDetail)}
                  disabled={downloadingInvoiceId === showDetail.id}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {downloadingInvoiceId === showDetail.id ? 'Generating...' : 'Download PDF'}
                </button>
                <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
            </div>

            <div className="p-8">
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                  <div className="mb-4 md:mb-0 flex items-start gap-4">
                    {(showDetail.agency_branding?.logo_url || branding.logoUrl || agency?.logoUrl) && (
                      <img src={showDetail.agency_branding?.logo_url || branding.logoUrl || agency?.logoUrl} alt="Agency logo" className="h-14 w-14 rounded-lg border border-slate-200 bg-white object-contain p-1" />
                    )}
                    <div>
                    <div className="text-xl font-bold text-[#0F172A] dark:text-white mb-1">{showDetail.agency_branding?.name || branding.name || agency?.name || 'TravelDesk Pro'}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      {(showDetail.agency_branding?.address || branding.address || agency?.address) && <div>{showDetail.agency_branding?.address || branding.address || agency?.address}</div>}
                      {(showDetail.agency_branding?.phone || branding.phone || agency?.phone) && <div>Phone: {showDetail.agency_branding?.phone || branding.phone || agency?.phone}</div>}
                      {(showDetail.agency_branding?.email || branding.email || agency?.email) && <div>Email: {showDetail.agency_branding?.email || branding.email || agency?.email}</div>}
                      {(showDetail.agency_branding?.website || branding.website) && <div>Web: {showDetail.agency_branding?.website || branding.website}</div>}
                      {(showDetail.agency_branding?.cr_number || branding.crNumber) && <div>CR: {showDetail.agency_branding?.cr_number || branding.crNumber}</div>}
                      {(showDetail.agency_branding?.vat_number || branding.vatNumber) && <div>VAT: {showDetail.agency_branding?.vat_number || branding.vatNumber}</div>}
                    </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 min-w-[220px] shadow-sm">
                    <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold mb-1">Invoice Number</div>
                    <div className="text-lg font-bold text-[#0F172A] dark:text-white mb-3">{showDetail.invoice_number}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold mb-1">Invoice Date</div>
                    <div className="text-sm font-medium text-[#0F172A] dark:text-white mb-3">{new Date(showDetail.issued_at).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold mb-1">Due Date</div>
                    <div className="text-sm font-medium text-[#0F172A] dark:text-white mb-3">{showDetail.due_date ? new Date(showDetail.due_date).toLocaleDateString() : '—'}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold mb-1">Status</div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${INVOICE_STATUS_COLORS[showDetail.status].bg} ${INVOICE_STATUS_COLORS[showDetail.status].text} ${INVOICE_STATUS_COLORS[showDetail.status].border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${INVOICE_STATUS_COLORS[showDetail.status].dot}`} />
                      {showDetail.status.charAt(0).toUpperCase() + showDetail.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold mb-3">Bill To</div>
                  <div className="font-semibold text-[#0F172A] dark:text-white text-sm">{showDetail.customer_name}</div>
                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {showDetail.customer_passport && <div>Passport: {showDetail.customer_passport}</div>}
                    {showDetail.customer_phone && <div>Phone: {showDetail.customer_phone}</div>}
                    {showDetail.customer_email && <div>Email: {showDetail.customer_email}</div>}
                    {showDetail.customer_nationality && <div>Nationality: {showDetail.customer_nationality}</div>}
                  </div>
                </div>

                <div className="p-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-xs text-slate-400 uppercase tracking-wide font-semibold">Description</th>
                        <th className="text-center py-2 text-xs text-slate-400 uppercase tracking-wide font-semibold w-20">Qty</th>
                        <th className="text-right py-2 text-xs text-slate-400 uppercase tracking-wide font-semibold w-28">Unit Price</th>
                        <th className="text-right py-2 text-xs text-slate-400 uppercase tracking-wide font-semibold w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {showDetail.items.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}>
                          <td className="py-3 text-sm text-[#0F172A] dark:text-white">{item.description}</td>
                          <td className="py-3 text-sm text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                          <td className="py-3 text-sm text-right text-slate-600">{getCurrencySymbol(showDetail.currency)} {item.unit_price.toFixed(2)}</td>
                          <td className="py-3 text-sm text-right font-medium text-[#0F172A]">{getCurrencySymbol(showDetail.currency)} {item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end mt-4">
                    <div className="w-72 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-medium text-[#0F172A]">{getCurrencySymbol(showDetail.currency)} {showDetail.subtotal.toFixed(2)}</span>
                      </div>
                      {showDetail.tax_enabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Tax ({showDetail.tax_percentage}%)</span>
                          <span className="font-medium text-[#0F172A]">{getCurrencySymbol(showDetail.currency)} {showDetail.tax.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span className="text-base font-bold text-[#0F172A]">Grand Total</span>
                        <span className="text-lg font-bold text-[#2563EB]">{getCurrencySymbol(showDetail.currency)} {showDetail.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {showDetail.notes && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Notes</div>
                      <div className="text-sm text-slate-600 whitespace-pre-line">{showDetail.notes}</div>
                    </div>
                  )}

                  {(showDetail.agency_branding?.bank_name || branding.bankName) && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">Payment Information</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                        {(showDetail.agency_branding?.bank_name || branding.bankName) && <div><span className="text-slate-400">Bank:</span> {showDetail.agency_branding?.bank_name || branding.bankName}</div>}
                        {(showDetail.agency_branding?.account_name || branding.accountName) && <div><span className="text-slate-400">Account Name:</span> {showDetail.agency_branding?.account_name || branding.accountName}</div>}
                        {(showDetail.agency_branding?.account_number || branding.accountNumber) && <div><span className="text-slate-400">Account #:</span> {showDetail.agency_branding?.account_number || branding.accountNumber}</div>}
                        {(showDetail.agency_branding?.iban || branding.iban) && <div><span className="text-slate-400">IBAN:</span> {showDetail.agency_branding?.iban || branding.iban}</div>}
                        {(showDetail.agency_branding?.swift_code || branding.swiftCode) && <div><span className="text-slate-400">SWIFT:</span> {showDetail.agency_branding?.swift_code || branding.swiftCode}</div>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 text-center text-xs text-slate-400">
                  Generated by TravelDesk Pro
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWhatsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowWhatsApp(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-500" /> Share via WhatsApp Web
                </h2>
                <p className="text-xs text-slate-500 mt-1">WhatsApp Business API send is Coming Soon.</p>
              </div>
              <button onClick={() => setShowWhatsApp(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">To: <strong>{showWhatsApp.customer_name}</strong></p>
              <button onClick={() => sendWhatsApp('invoice_message')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors text-left">
                <Send className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="text-sm font-medium text-[#0F172A] dark:text-white">Open WhatsApp Web</div>
                  <div className="text-xs text-slate-500">Prefill invoice details and amount</div>
                </div>
              </button>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Direct WhatsApp Business API actions are Coming Soon and are hidden from production until connected.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
