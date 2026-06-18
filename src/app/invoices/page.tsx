'use client';

import React, { useState, useMemo } from 'react';
import { useInvoices, InvoiceItem, InvoiceRecord, useInvoiceSettings, useAgencyBranding, useCustomers } from '@/hooks/useDataStore';
import { usePermissions } from '@/hooks/useDataStore';
import { useAuth } from '@/context/AuthContext';
import { useDataMode } from '@/context/DataModeContext';
import { Search, Plus, X, Save, Printer, Download, MessageCircle, Trash2, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Send, Smartphone, MoreHorizontal, Eye, Pencil, Copy } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CURRENCIES, getCurrencySymbol, INVOICE_STATUS_COLORS, WHATSAPP_TEMPLATES } from '@/lib/constants';
import { generateInvoicePDF } from '@/components/invoice/InvoicePDF';
import { openWhatsAppWeb, buildMessage, getInvoiceWhatsAppVars } from '@/lib/whatsapp';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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

const REFERENCE_TYPES = ['PNR', 'Visa Number', 'Voucher Number', 'Ticket Number', 'Booking Reference', 'Other'] as const;
type ReferenceType = typeof REFERENCE_TYPES[number];

function getReferenceInputLabel(type: ReferenceType) {
  if (type === 'Other') return 'Reference Number';
  return `${type} Number`;
}

function getInvoiceReference(invoice: Pick<InvoiceRecord, 'reference_type' | 'reference_number' | 'custom_reference_label'>) {
  return {
    type: invoice.reference_type || 'Booking Reference',
    label: invoice.reference_type === 'Other' ? (invoice.custom_reference_label || 'Reference') : (invoice.reference_type || 'Booking Reference'),
    number: invoice.reference_number || '',
  };
}

export default function InvoicesPage() {
  const { invoices, loading, create, update, updateStatus, remove } = useInvoices();
  const { can } = usePermissions();
  const { user, agency } = useAuth();
  const { useLocalStorage } = useDataMode();
  const { settings: invoiceSettings, generateNumber } = useInvoiceSettings();
  const { branding } = useAgencyBranding();
  const { customers } = useCustomers();

  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<typeof invoices[0] | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState<typeof invoices[0] | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<typeof invoices[0] | null>(null);
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_id: '',
    customer_name: '',
    customer_passport: '',
    customer_phone: '',
    customer_email: '',
    customer_nationality: '',
    reference_type: 'PNR' as ReferenceType,
    reference_number: '',
    custom_reference_label: '',
    service_type: '',
    agent_name: '',
    travel_date: '',
    booking_status: 'Pending',
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

  const openCreate = () => {
    const num = generateNumber();
    setForm({
      customer_id: '',
      customer_name: '',
      customer_passport: '',
      customer_phone: '',
      customer_email: '',
      customer_nationality: '',
      reference_type: 'PNR',
      reference_number: '',
      custom_reference_label: '',
      service_type: '',
      agent_name: '',
      travel_date: '',
      booking_status: 'Pending',
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
    setEditingInvoice(null);
    setSaveError(null);
    setShowModal(true);
  };

  const invoiceToForm = (invoice: typeof invoices[0]) => ({
    customer_id: invoice.customer_id,
    customer_name: invoice.customer_name,
    customer_passport: invoice.customer_passport || '',
    customer_phone: invoice.customer_phone || '',
    customer_email: invoice.customer_email || '',
    customer_nationality: invoice.customer_nationality || '',
    reference_type: (invoice.reference_type || 'Booking Reference') as ReferenceType,
    reference_number: invoice.reference_number || '',
    custom_reference_label: invoice.custom_reference_label || '',
    service_type: invoice.service_type || invoice.items?.[0]?.description || '',
    agent_name: invoice.agent_name || '',
    travel_date: invoice.travel_date ? toDateInputValue(new Date(invoice.travel_date)) : '',
    booking_status: invoice.booking_status || (invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)),
    invoice_number: invoice.invoice_number,
    prefix: invoice.prefix,
    items: invoice.items.map((item) => ({ ...item })),
    subtotal: invoice.subtotal,
    tax_enabled: invoice.tax_enabled,
    tax_percentage: invoice.tax_percentage,
    tax: invoice.tax,
    total: invoice.total,
    currency: invoice.currency,
    status: invoice.status,
    issued_at: toDateInputValue(new Date(invoice.issued_at)),
    due_date: toDateInputValue(new Date(invoice.due_date)),
    notes: invoice.notes || invoiceSettings.defaultNotes,
  });

  const openEdit = (invoice: typeof invoices[0]) => {
    setForm(invoiceToForm(invoice));
    setEditingInvoice(invoice);
    setSaveError(null);
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

      const invoicePayload = {
        customer_id: form.customer_id,
        customer_name: form.customer_name,
        customer_passport: form.customer_passport,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email,
        customer_nationality: form.customer_nationality,
        reference_type: form.reference_type,
        reference_number: form.reference_number,
        custom_reference_label: form.custom_reference_label,
        service_type: form.service_type,
        agent_name: form.agent_name,
        travel_date: form.travel_date ? parseDateInput(form.travel_date, 'Travel date').toISOString() : '',
        booking_status: form.booking_status,
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
          reference_type: form.reference_type,
          reference_number: form.reference_number,
          custom_reference_label: form.custom_reference_label,
          service_type: form.service_type,
          agent_name: form.agent_name,
          travel_date: form.travel_date ? parseDateInput(form.travel_date, 'Travel date').toISOString() : '',
          booking_status: form.booking_status,
        },
      };
      if (editingInvoice) {
        await update(editingInvoice.id, invoicePayload);
      } else {
        await create(invoicePayload);
      }
      setShowModal(false);
      setEditingInvoice(null);
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
    logoUrl: branding.logoUrl || agency?.logoUrl || invoice.agency_branding?.logo_url || '',
    name: branding.name || agency?.name || invoice.agency_branding?.name || 'TravelDesk Pro',
    address: branding.address || agency?.address || invoice.agency_branding?.address || '',
    phone: branding.phone || agency?.phone || invoice.agency_branding?.phone || '',
    email: branding.email || agency?.email || invoice.agency_branding?.email || '',
    website: branding.website || invoice.agency_branding?.website || '',
    crNumber: branding.crNumber || invoice.agency_branding?.cr_number || '',
    vatNumber: branding.vatNumber || invoice.agency_branding?.vat_number || '',
    bankName: branding.bankName || invoice.agency_branding?.bank_name || '',
    accountName: branding.accountName || invoice.agency_branding?.account_name || '',
    accountNumber: branding.accountNumber || invoice.agency_branding?.account_number || '',
    iban: branding.iban || invoice.agency_branding?.iban || '',
    swiftCode: branding.swiftCode || invoice.agency_branding?.swift_code || '',
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
    const q = query.toLowerCase().trim();
    let data = invoices.filter((i) => {
      const ref = getInvoiceReference(i);
      return (
        i.customer_name.toLowerCase().includes(q) ||
        i.invoice_number.toLowerCase().includes(q) ||
        i.status.toLowerCase().includes(q) ||
        ref.type.toLowerCase().includes(q) ||
        ref.label.toLowerCase().includes(q) ||
        ref.number.toLowerCase().includes(q) ||
        (i.service_type || '').toLowerCase().includes(q) ||
        (i.agent_name || '').toLowerCase().includes(q)
      );
    });
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

  const duplicateInvoice = async (invoice: typeof invoices[0]) => {
    const nextNumber = generateNumber();
    const duplicate = {
      ...invoice,
      invoice_number: nextNumber,
      prefix: invoiceSettings.prefix,
      sequence: parseInt(nextNumber.split('-').pop() || '0'),
      status: 'pending' as const,
      issued_at: new Date().toISOString(),
      due_date: new Date(`${getDefaultDueDate()}T00:00:00.000Z`).toISOString(),
      paid_at: undefined,
      notes: invoice.notes || invoiceSettings.defaultNotes,
    };
    const { id: _id, agency_id: _agencyId, created_at: _createdAt, ...payload } = duplicate;
    await create(payload);
  };

  const sendWhatsApp = (type: keyof typeof WHATSAPP_TEMPLATES) => {
    if (!showWhatsApp) return;
    const vars = getInvoiceWhatsAppVars(showWhatsApp, branding);
    const { body } = buildMessage(type, vars);
    const phone = showWhatsApp.customer_phone || '';
    if (!phone) { alert('Customer phone number required to share invoice.'); return; }
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
          <h1 className="text-2xl font-bold text-[#0F172A]">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">Create, manage, and send professional invoices</p>
        </div>
        {can('create') && (
          <Button variant="primary" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Create Invoice
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 border border-slate-200 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{totalInvoices}</p>
            <p className="text-xs text-slate-500 font-medium">Total Invoices</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border border-slate-200 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalPaid, 'OMR')}</p>
            <p className="text-xs text-slate-500 font-medium">Paid</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border border-slate-200 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalPending, 'OMR')}</p>
            <p className="text-xs text-slate-500 font-medium">Pending</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border border-slate-200 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalOverdue, 'OMR')}</p>
            <p className="text-xs text-slate-500 font-medium">Overdue</p>
          </div>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by invoice number, customer, PNR, visa, voucher, ticket, booking reference, or status..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm"
        />
      </div>

      {invoices.length === 0 && (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-white">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Printer className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#0F172A]">No invoices yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
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
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide cursor-pointer hover:text-slate-700" onClick={() => toggleSort('invoice_number')}>
                    <span className="flex items-center gap-1">Invoice # {sortConfig?.key === 'invoice_number' && (sortConfig.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Reference</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv) => {
                  const colors = INVOICE_STATUS_COLORS[inv.status];
                  const ref = getInvoiceReference(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#0F172A] text-sm">{inv.invoice_number}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{inv.prefix}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#0F172A]">{inv.customer_name}</td>
                      <td className="px-5 py-4">
                        {ref.number ? (
                          <div>
                            <div className="text-xs font-semibold text-[#0F172A]">{ref.number}</div>
                            <div className="text-[11px] text-slate-400">{ref.label}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{formatDate(inv.issued_at)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-[#0F172A] text-sm">
                        {getCurrencySymbol(inv.currency)} {inv.total.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setOpenActionsId((prev) => (prev === inv.id ? null : inv.id))}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Actions <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openActionsId === inv.id && (
                            <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 p-1 text-left">
                              <button onClick={() => { setShowDetail(inv); setOpenActionsId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-700">
                                <Eye className="w-4 h-4" /> View Invoice
                              </button>
                              <button onClick={() => { openEdit(inv); setOpenActionsId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-700">
                                <Pencil className="w-4 h-4" /> Edit Invoice
                              </button>
                              <button onClick={() => { downloadInvoicePdf(inv); setOpenActionsId(null); }} disabled={downloadingInvoiceId === inv.id} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-700 disabled:opacity-60">
                                <Download className="w-4 h-4" /> Download PDF
                              </button>
                              <button onClick={() => { setShowWhatsApp(inv); setOpenActionsId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 text-slate-700">
                                <MessageCircle className="w-4 h-4" /> Share WhatsApp
                              </button>
                              <button onClick={() => { duplicateInvoice(inv); setOpenActionsId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-700">
                                <Copy className="w-4 h-4" /> Duplicate Invoice
                              </button>
                              {can('delete') && (
                                <button onClick={() => { handleDelete(inv.id); setOpenActionsId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-50 text-red-600">
                                  <Trash2 className="w-4 h-4" /> Delete Invoice
                                </button>
                              )}
                            </div>
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
            <div className="text-center py-12 text-sm text-slate-400">No invoices match your search.</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowModal(false); setEditingInvoice(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#0F172A]">{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</h2>
              <button onClick={() => { setShowModal(false); setEditingInvoice(null); }} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Prefix</label>
                  <input
                    value={form.prefix}
                    onChange={(e) => setForm((prev) => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-slate-50/50"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Invoice Number</label>
                  <input
                    value={form.invoice_number}
                    readOnly
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Issue Date</label>
                  <input type="date" value={form.issued_at} onChange={(e) => setForm((prev) => ({ ...prev, issued_at: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Due Date</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Travel Reference</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Reference Type</label>
                    <select
                      value={form.reference_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, reference_type: e.target.value as ReferenceType, reference_number: '', custom_reference_label: '' }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                    >
                      {REFERENCE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  {form.reference_type === 'Other' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Custom Label</label>
                      <input
                        value={form.custom_reference_label}
                        onChange={(e) => setForm((prev) => ({ ...prev, custom_reference_label: e.target.value }))}
                        placeholder="Reference label"
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{getReferenceInputLabel(form.reference_type)}</label>
                    <input
                      value={form.reference_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, reference_number: e.target.value.toUpperCase() }))}
                      placeholder={form.reference_type === 'PNR' ? 'WUHY58U' : form.reference_type === 'Visa Number' ? 'AE2026V12345' : 'Reference number'}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Service Type</label>
                    <input
                      value={form.service_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, service_type: e.target.value }))}
                      placeholder="Leisure Travel"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Travel Date</label>
                    <input
                      type="date"
                      value={form.travel_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, travel_date: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Agent Name</label>
                    <input
                      value={form.agent_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, agent_name: e.target.value }))}
                      placeholder="Agent name"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Booking Status</label>
                    <input
                      value={form.booking_status}
                      onChange={(e) => setForm((prev) => ({ ...prev, booking_status: e.target.value }))}
                      placeholder="Confirmed / Pending"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Customer</label>
                <select
                  value={form.customer_id}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white mb-3"
                >
                  <option value="">Select a customer or type below...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Customer Name *" value={form.customer_name} onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" required />
                  <input placeholder="Phone" value={form.customer_phone} onChange={(e) => setForm((prev) => ({ ...prev, customer_phone: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  <input placeholder="Email" value={form.customer_email} onChange={(e) => setForm((prev) => ({ ...prev, customer_email: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  <input placeholder="Passport Number" value={form.customer_passport} onChange={(e) => setForm((prev) => ({ ...prev, customer_passport: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  <input placeholder="Nationality" value={form.customer_nationality} onChange={(e) => setForm((prev) => ({ ...prev, customer_nationality: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand sm:col-span-2" />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items</h3>
                  <button onClick={addItem} className="text-sm text-brand font-medium hover:text-brand/80 transition-colors">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-white rounded-lg border border-slate-100 p-2">
                      <div className="col-span-5">
                        <input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Description" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} placeholder="Qty" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-center" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" min={0} step={0.01} value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))} placeholder="Unit Price" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#0F172A]">{getCurrencySymbol(form.currency)} {item.total.toFixed(2)}</span>
                        {form.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600">
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                    {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    <input
                      type="checkbox"
                      checked={form.tax_enabled}
                      onChange={(e) => setForm((prev) => recalc({ ...prev, tax_enabled: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
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
                        className="w-20 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-sm text-slate-500">%</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as any }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-500">Subtotal</span>
                  <span className="text-sm font-medium text-[#0F172A]">{getCurrencySymbol(form.currency)} {form.subtotal.toFixed(2)}</span>
                </div>
                {form.tax_enabled && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-slate-500">Tax ({form.tax_percentage}%)</span>
                    <span className="text-sm font-medium text-[#0F172A]">{getCurrencySymbol(form.currency)} {form.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
                  <span className="text-base font-bold text-[#0F172A]">Grand Total</span>
                  <span className="text-xl font-bold text-[#2563EB]">{getCurrencySymbol(form.currency)} {form.total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Thank you for choosing our services. Payment terms: 30 days."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                />
              </div>

              {(branding.bankName || branding.iban) && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Payment Information (from Agency Branding)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                    {branding.bankName && <div><span className="text-slate-400">Bank:</span> {branding.bankName}</div>}
                    {branding.accountName && <div><span className="text-slate-400">Account Name:</span> {branding.accountName}</div>}
                    {branding.accountNumber && <div><span className="text-slate-400">Account #:</span> {branding.accountNumber}</div>}
                    {branding.iban && <div><span className="text-slate-400">IBAN:</span> {branding.iban}</div>}
                    {branding.swiftCode && <div><span className="text-slate-400">SWIFT:</span> {branding.swiftCode}</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 space-y-3">
              {saveError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                  <span>{saveError}</span>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowModal(false); setEditingInvoice(null); }} disabled={saving}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} className="gap-2" disabled={saving}>
                  <Save className="w-4 h-4" /> {saving ? 'Saving…' : editingInvoice ? 'Update Invoice' : 'Save Invoice'}
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
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#0F172A]">Invoice {showDetail.invoice_number}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadInvoicePdf(showDetail)}
                  disabled={downloadingInvoiceId === showDetail.id}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {downloadingInvoiceId === showDetail.id ? 'Generating...' : 'Download PDF'}
                </button>
                <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
            </div>

            <div className="p-8">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between p-6 border-b border-slate-100 bg-slate-50/30">
                  <div className="mb-4 md:mb-0 flex items-start gap-4">
                    {(showDetail.agency_branding?.logo_url || branding.logoUrl || agency?.logoUrl) && (
                      <img src={showDetail.agency_branding?.logo_url || branding.logoUrl || agency?.logoUrl} alt="Agency logo" className="h-14 w-14 rounded-lg border border-slate-200 bg-white object-contain p-1" />
                    )}
                    <div>
                    <div className="text-xl font-bold text-[#0F172A] mb-1">{showDetail.agency_branding?.name || branding.name || agency?.name || 'TravelDesk Pro'}</div>
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
                  <div className="bg-white border border-slate-200 rounded-xl p-5 min-w-[220px] shadow-sm">
                    <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Invoice Number</div>
                    <div className="text-lg font-bold text-[#0F172A] mb-3">{showDetail.invoice_number}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Invoice Date</div>
                    <div className="text-sm font-medium text-[#0F172A] mb-3">{new Date(showDetail.issued_at).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Due Date</div>
                    <div className="text-sm font-medium text-[#0F172A] mb-3">{showDetail.due_date ? new Date(showDetail.due_date).toLocaleDateString() : '—'}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Status</div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${INVOICE_STATUS_COLORS[showDetail.status].bg} ${INVOICE_STATUS_COLORS[showDetail.status].text} ${INVOICE_STATUS_COLORS[showDetail.status].border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${INVOICE_STATUS_COLORS[showDetail.status].dot}`} />
                      {showDetail.status.charAt(0).toUpperCase() + showDetail.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="p-6 border-b border-slate-100">
                  <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">Bill To</div>
                  <div className="font-semibold text-[#0F172A] text-sm">{showDetail.customer_name}</div>
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
                    <tbody className="divide-y divide-slate-100">
                      {showDetail.items.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : ''}>
                          <td className="py-3 text-sm text-[#0F172A]">{item.description}</td>
                          <td className="py-3 text-sm text-center text-slate-600">{item.quantity}</td>
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-500" /> Share via WhatsApp Web
                </h2>
                <p className="text-xs text-slate-500 mt-1">Send a prefilled invoice message to the customer.</p>
              </div>
              <button onClick={() => setShowWhatsApp(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-2">To: <strong>{showWhatsApp.customer_name}</strong></p>
              <button onClick={() => sendWhatsApp('invoice_message')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors text-left">
                <Send className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="text-sm font-medium text-[#0F172A]">Open WhatsApp Web</div>
                  <div className="text-xs text-slate-500">Prefill invoice details and amount</div>
                </div>
              </button>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                Opens WhatsApp with invoice number, reference, amount, and agency name prefilled.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
