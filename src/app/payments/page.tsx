'use client';

import React, { useState, useMemo } from 'react';
import { usePayments, PaymentRecord, useInvoices } from '@/hooks/useDataStore';
import { usePermissions } from '@/hooks/useDataStore';
import { useLanguage } from '@/context/LanguageContext';
import { exportCSV, exportXLSX } from '@/lib/export';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Plus, X, Save, Trash2, CreditCard, DollarSign, CheckCircle,
  Clock, Download, Search, Banknote, Smartphone, Building2, AlertCircle,
} from 'lucide-react';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  online: 'Online',
};

const METHOD_COLORS: Record<string, string> = {
  cash: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  card: 'bg-blue-50 text-blue-700 border-blue-200',
  bank_transfer: 'bg-purple-50 text-purple-700 border-purple-200',
  online: 'bg-amber-50 text-amber-700 border-amber-200',
};

const METHOD_ICONS: Record<string, React.FC<{ className?: string }>> = {
  cash: Banknote,
  card: CreditCard,
  bank_transfer: Building2,
  online: Smartphone,
};

export default function PaymentsPage() {
  const { payments, loading, create, remove } = usePayments();
  const { invoices } = useInvoices();
  const { can } = usePermissions();
  const { t } = useLanguage();

  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    invoice_id: '',
    amount: 0,
    currency: 'OMR',
    method: 'cash' as PaymentRecord['method'],
    reference: '',
    notes: '',
  });

  const openCreate = () => {
    setForm({ invoice_id: '', amount: 0, currency: 'OMR', method: 'cash', reference: '', notes: '' });
    setSaveError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaveError(null);
    if (!form.invoice_id) { setSaveError('Please select an invoice.'); return; }
    if (form.amount <= 0) { setSaveError('Amount must be greater than 0.'); return; }

    setSaving(true);
    try {
      const selectedInvoice = invoices.find((i) => i.id === form.invoice_id);
      await create({
        invoice_id: form.invoice_id,
        amount: form.amount,
        currency: form.currency,
        method: form.method,
        reference: form.reference || null,
        notes: form.notes || null,
        invoice_number: selectedInvoice?.invoice_number,
        customer_name: selectedInvoice?.customer_name,
      });
      setShowModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.message ?? 'Failed to record payment.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this payment record? This cannot be undone.')) remove(id);
  };

  // Enrich display: attach invoice_number + customer_name if missing (localStorage mode)
  const enriched = useMemo(() => payments.map((p) => {
    if (p.invoice_number) return p;
    const inv = invoices.find((i) => i.id === p.invoice_id);
    return { ...p, invoice_number: inv?.invoice_number, customer_name: inv?.customer_name };
  }), [payments, invoices]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return enriched.filter((p) =>
      (p.invoice_number || '').toLowerCase().includes(q) ||
      (p.customer_name || '').toLowerCase().includes(q) ||
      p.method.toLowerCase().includes(q)
    );
  }, [enriched, query]);

  // Stats
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const byCash = payments.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount, 0);
  const byCard = payments.filter((p) => p.method === 'card').reduce((s, p) => s + p.amount, 0);
  const byBank = payments.filter((p) => p.method === 'bank_transfer').reduce((s, p) => s + p.amount, 0);
  const currency = 'OMR';

  const handleExportCSV = () => {
    exportCSV(
      filtered.map((p) => ({
        Date: formatDate(p.created_at),
        Invoice: p.invoice_number ?? p.invoice_id,
        Customer: p.customer_name ?? '',
        Amount: p.amount,
        Currency: p.currency,
        Method: METHOD_LABELS[p.method] ?? p.method,
        Reference: p.reference ?? '',
        Notes: p.notes ?? '',
      })),
      `payments-${new Date().toISOString().split('T')[0]}`
    );
  };

  const handleExportXLSX = () => {
    exportXLSX(
      filtered.map((p) => ({
        Date: formatDate(p.created_at),
        Invoice: p.invoice_number ?? p.invoice_id,
        Customer: p.customer_name ?? '',
        Amount: p.amount,
        Currency: p.currency,
        Method: METHOD_LABELS[p.method] ?? p.method,
        Reference: p.reference ?? '',
        Notes: p.notes ?? '',
      })),
      `payments-${new Date().toISOString().split('T')[0]}`,
      'Payments'
    );
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Payments</h1>
          <p className="text-sm text-slate-500 mt-1">Record and track payments against invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={handleExportXLSX} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> Excel
          </button>
          {can('create') && (
            <Button variant="primary" className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 border border-slate-200 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#0F172A]">{formatCurrency(totalCollected, currency)}</p>
            <p className="text-xs text-slate-500 font-medium">Total Collected</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border border-slate-200 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#0F172A]">{formatCurrency(byCash, currency)}</p>
            <p className="text-xs text-slate-500 font-medium">Cash</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border border-slate-200 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#0F172A]">{formatCurrency(byCard, currency)}</p>
            <p className="text-xs text-slate-500 font-medium">Card</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border border-slate-200 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#0F172A]">{formatCurrency(byBank, currency)}</p>
            <p className="text-xs text-slate-500 font-medium">Bank Transfer</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by invoice, customer, or method..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm"
        />
      </div>

      {/* Empty state */}
      {payments.length === 0 && (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-white">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <CreditCard className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#0F172A]">No payments recorded</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Record payments received from customers against invoices.</p>
          {can('create') && (
            <Button variant="primary" className="mt-5 gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Record First Payment
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      {payments.length > 0 && (
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Invoice</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Customer</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Method</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Reference</th>
                  {can('delete') && <th className="px-5 py-3.5" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const MethodIcon = METHOD_ICONS[p.method] ?? CreditCard;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 text-xs text-slate-500">{formatDate(p.created_at)}</td>
                      <td className="px-5 py-4 font-semibold text-[#0F172A] text-sm">{p.invoice_number ?? p.invoice_id.slice(0, 8)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{p.customer_name ?? '—'}</td>
                      <td className="px-5 py-4 text-right font-bold text-emerald-700 text-sm">{formatCurrency(p.amount, p.currency)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${METHOD_COLORS[p.method] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          <MethodIcon className="w-3 h-3" />
                          {METHOD_LABELS[p.method] ?? p.method}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 max-w-[140px] truncate">{p.reference ?? '—'}</td>
                      {can('delete') && (
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-slate-400">No payments match your search.</div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A]">Record Payment</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Invoice *</label>
                <select
                  value={form.invoice_id}
                  onChange={(e) => {
                    const inv = invoices.find((i) => i.id === e.target.value);
                    setForm((prev) => ({ ...prev, invoice_id: e.target.value, amount: inv?.total ?? prev.amount, currency: inv?.currency ?? prev.currency }));
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                >
                  <option value="">Select invoice…</option>
                  {invoices.filter((i) => i.status === 'pending' || i.status === 'overdue').map((i) => (
                    <option key={i.id} value={i.id}>{i.invoice_number} — {i.customer_name} ({formatCurrency(i.total, i.currency)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Amount *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Currency</label>
                  <input
                    value={form.currency}
                    onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Payment Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['cash', 'card', 'bank_transfer', 'online'] as PaymentRecord['method'][]).map((m) => {
                    const Icon = METHOD_ICONS[m] ?? CreditCard;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, method: m }))}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.method === m ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Icon className="w-4 h-4" /> {METHOD_LABELS[m]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Reference / Transaction ID</label>
                <input
                  value={form.reference}
                  onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
                  placeholder="e.g. cheque no., transaction ID"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 space-y-3">
              {saveError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                  <span>{saveError}</span>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} className="gap-2" disabled={saving}>
                  <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Record Payment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
