'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useBookings, useCustomers, BookingRecord } from '@/hooks/useDataStore';
import { usePermissions } from '@/hooks/useDataStore';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Search, Filter, Plus, Plane, FileText, Hotel, Users, X,
  Save, Calendar, CheckCircle, Edit2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CURRENCIES, BOOKING_TYPES, PAYMENT_STATUSES, PROCESS_STATUSES } from '@/lib/constants';

const typeIcons: Record<string, React.ReactNode> = {
  air_ticket: <Plane className="w-4 h-4" />,
  visa: <FileText className="w-4 h-4" />,
  hotel: <Hotel className="w-4 h-4" />,
  group_tour: <Users className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  air_ticket: 'Air Ticket', visa: 'Visa', hotel: 'Hotel', group_tour: 'Group Tour',
};

const typeColors: Record<string, string> = {
  air_ticket: 'bg-blue-50 text-blue-700 border-blue-200',
  visa: 'bg-orange-50 text-orange-700 border-orange-200',
  hotel: 'bg-slate-100 text-slate-700 border-slate-200',
  group_tour: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const statusColors: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  refund: 'bg-purple-100 text-purple-700 border-purple-200',
};

const processColors: Record<string, string> = {
  issued: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function BookingsPage() {
  const { bookings, loading, create, update, remove, search } = useBookings();
  const { customers } = useCustomers();
  const { can } = usePermissions();
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BookingRecord | null>(null);

  const [form, setForm] = useState<{
    customer_id: string;
    customer_name: string;
    type: 'air_ticket' | 'visa' | 'hotel' | 'group_tour';
    details: string; cost_price: string; sale_price: string; agent_commission: string;
    currency: string; payment_status: 'paid' | 'pending' | 'refund';
    process_status: 'pending' | 'processing' | 'approved' | 'rejected' | 'issued';
    agent_name: string; date: string;
  }>({
    customer_id: '', customer_name: '', type: 'air_ticket',
    details: '', cost_price: '', sale_price: '', agent_commission: '',
    currency: 'OMR', payment_status: 'pending',
    process_status: 'pending', agent_name: '',
    date: new Date().toISOString().split('T')[0],
  });

  const resetForm = () => {
    setForm({
      customer_id: '', customer_name: '', type: 'air_ticket',
      details: '', cost_price: '', sale_price: '', agent_commission: '',
      currency: 'OMR', payment_status: 'pending', process_status: 'pending',
      agent_name: '', date: new Date().toISOString().split('T')[0],
    });
    setEditing(null);
  };

  // Populates both customer_id (real UUID) and customer_name when a customer
  // is selected from the dropdown.
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const c = customers.find((x) => x.id === e.target.value);
    setForm((prev) => ({
      ...prev,
      customer_id: e.target.value,
      customer_name: c?.name ?? '',
    }));
  };

  const openCreate = () => {
    resetForm();
    setSaveError(null);
    setShowModal(true);
  };

  const openEdit = (b: BookingRecord) => {
    setForm({
      customer_id: b.customer_id,
      customer_name: b.customer_name,
      type: b.type,
      details: b.details,
      cost_price: String(b.cost_price),
      sale_price: String(b.sale_price),
      agent_commission: String(b.agent_commission),
      currency: b.currency,
      payment_status: b.payment_status,
      process_status: b.process_status,
      agent_name: b.agent_name || '',
      date: b.created_at.split('T')[0],
    });
    setEditing(b);
    setSaveError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    // [DEBUG] — remove before production release
    console.group('[TDP] handleSave');
    console.log('form.customer_id  :', form.customer_id || '(empty)');
    console.log('form.customer_name:', form.customer_name || '(empty)');
    console.log('form.sale_price   :', form.sale_price || '(empty)');
    console.groupEnd();

    if (!form.customer_id) {
      setSaveError('Please select a customer from the list.');
      return;
    }
    if (!form.sale_price) return;
    setSaveError(null);
    const data = {
      // Use the real customer UUID — never generate a fake one.
      customer_id: form.customer_id,
      customer_name: form.customer_name,
      type: form.type,
      details: form.details,
      cost_price: Number(form.cost_price) || 0,
      sale_price: Number(form.sale_price) || 0,
      agent_commission: Number(form.agent_commission) || 0,
      currency: form.currency,
      payment_status: form.payment_status,
      process_status: form.process_status,
      agent_id: undefined as string | undefined,
      agent_name: form.agent_name,
      notes: '',
    };
    try {
      if (editing) {
        // Pass data directly so the customer can be changed in edit mode.
        await update(editing.id, data);
      } else {
        await create(data);
      }
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      // Surfaces the Supabase error (FK violation, RLS rejection, etc.)
      // and the demo booking-limit message.
      setSaveError(err?.message ?? 'Failed to save booking. Please try again.');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this booking?')) remove(id);
  };

  const filtered = search(query, filter);

  const totalRevenue = bookings.reduce((s, b) => s + b.sale_price, 0);
  const totalCost = bookings.reduce((s, b) => s + b.cost_price, 0);
  const totalProfit = totalRevenue - totalCost;
  const pendingCount = bookings.filter(b => b.payment_status === 'pending').length;

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
          <h1 className="text-2xl font-bold text-[#0F172A]">Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all transactions</p>
        </div>
        {can('create') && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Export</Button>
            <Button variant="primary" className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> New Booking</Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Plane className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-[#0F172A]">{bookings.length}</p><p className="text-xs text-slate-500">Total Bookings</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalRevenue, 'OMR')}</p><p className="text-xs text-slate-500">Revenue</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange"><FileText className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalProfit, 'OMR')}</p><p className="text-xs text-slate-500">Net Profit</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Calendar className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-[#0F172A]">{pendingCount}</p><p className="text-xs text-slate-500">Pending Payments</p></div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bookings..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'air_ticket', 'visa', 'hotel', 'group_tour'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-brand text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              {f === 'all' ? 'All' : typeLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {bookings.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><Plane className="w-8 h-8 text-slate-400" /></div>
          <h3 className="text-lg font-semibold text-[#0F172A]">No bookings yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Create your first booking to start tracking transactions.</p>
          {can('create') && (
            <Button variant="primary" className="mt-4 gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> Create First Booking</Button>
          )}
        </div>
      )}

      {/* Table */}
      {bookings.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">ID</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Customer</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Type</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Details</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Amount</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Payment</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Date</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{b.id.slice(0, 8)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold">{b.customer_name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        <span className="font-medium text-[#0F172A] text-sm">{b.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${typeColors[b.type]}`}>{typeIcons[b.type]} {typeLabels[b.type]}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs max-w-[150px] truncate">{b.details}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#0F172A] text-sm">{formatCurrency(b.sale_price, b.currency)}</p>
                      <p className="text-xs text-slate-400">Cost: {formatCurrency(b.cost_price, b.currency)}</p>
                    </td>
                    <td className="px-5 py-4"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[b.payment_status]}`}>{b.payment_status}</span></td>
                    <td className="px-5 py-4"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${processColors[b.process_status]}`}>{b.process_status}</span></td>
                    <td className="px-5 py-4 text-xs text-slate-500">{formatDate(b.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {can('edit') && <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>}
                        {can('delete') && <button onClick={() => handleDelete(b.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Delete"><X className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && query && (
            <div className="p-8 text-center text-slate-500">
              <p>No results for "{query}"</p>
              <button onClick={() => setQuery('')} className="text-brand text-sm mt-1 hover:underline">Clear search</button>
            </div>
          )}
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="sticky top-0 bg-white z-10 pb-4 border-b border-slate-100 flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F172A]">{editing ? 'Edit Booking' : 'New Booking'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer selector — uses the real customers.id UUID as FK */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
                  {customers.length === 0 ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
                      <Users className="w-4 h-4 shrink-0" />
                      No customers found.{' '}
                      <Link
                        href="/customers"
                        className="underline font-medium hover:text-amber-900"
                        onClick={() => setShowModal(false)}
                      >
                        Add a customer first
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={form.customer_id}
                      onChange={handleCustomerChange}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    >
                      <option value="">— Select customer —</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.phone}
                        </option>
                      ))}
                    </select>
                  )}
                  {/* Warn when editing a booking whose customer was deleted */}
                  {editing && form.customer_id && !customers.find((c) => c.id === form.customer_id) && (
                    <p className="text-xs text-amber-600 mt-1">
                      Previous customer "{form.customer_name}" is no longer in the list. Select a replacement or keep the existing record.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Booking Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                    {BOOKING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Details</label>
                  <input value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Route, hotel, visa country, tour name" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Cost Price</label><input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="0.00" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Sale Price *</label><input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="0.00" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Commission %</label><input type="number" value={form.agent_commission} onChange={(e) => setForm({ ...form, agent_commission: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="0" /></div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment</label>
                  <select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as any })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                    {PAYMENT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Process</label>
                  <select value={form.process_status} onChange={(e) => setForm({ ...form, process_status: e.target.value as any })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                    {PROCESS_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" /></div>
              </div>
            </div>
            {/* [DEBUG] — shows customer_id in modal so you can verify it is set */}
            <div className="mt-2 px-3 py-1.5 bg-slate-100 rounded text-xs font-mono text-slate-500 border border-slate-200">
              customer_id: <span className={form.customer_id ? 'text-emerald-700' : 'text-red-600 font-bold'}>
                {form.customer_id || '(none — select a customer above)'}
              </span>
            </div>

            {saveError && (
              <div className="mt-3 px-4 py-3 bg-red-50 border-2 border-red-400 rounded-xl text-sm text-red-700 font-medium flex items-start gap-2">
                <span className="text-red-500 text-base leading-none mt-0.5">⚠</span>
                {saveError}
              </div>
            )}
            <div className="sticky bottom-0 bg-white pt-4 mt-4 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} className="gap-2"><Save className="w-4 h-4" /> Save Booking</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

