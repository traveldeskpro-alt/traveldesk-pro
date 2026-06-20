'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useBookings, useCustomers, useAgents, BookingRecord, calculateCommission } from '@/hooks/useDataStore';
import { usePermissions } from '@/hooks/useDataStore';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import {
  Search, Filter, Plus, Plane, FileText, Hotel, Users, X,
  Save, Calendar, CheckCircle, Edit2, UserCheck, Shield, MoreHorizontal,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CURRENCIES, BOOKING_TYPES, PAYMENT_STATUSES, PROCESS_STATUSES, VISA_TYPES } from '@/lib/constants';
import { AIRLINES, AIRLINE_OPTIONS, getAirlineByCode } from '@/lib/airlines';
import { AIRPORT_OPTIONS } from '@/lib/airports';
import { COUNTRY_OPTIONS } from '@/lib/countries';

// ─── type display maps ────────────────────────────────────────────────────────

const typeIcons: Record<string, React.ReactNode> = {
  air_ticket: <Plane className="w-4 h-4" />,
  visa: <FileText className="w-4 h-4" />,
  hotel: <Hotel className="w-4 h-4" />,
  group_tour: <Users className="w-4 h-4" />,
  insurance: <Shield className="w-4 h-4" />,
  other_service: <MoreHorizontal className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  air_ticket: 'Flight Ticket',
  visa: 'Visa',
  hotel: 'Hotel',
  group_tour: 'Tour Package',
  insurance: 'Insurance',
  other_service: 'Other Service',
};

const typeColors: Record<string, string> = {
  air_ticket: 'bg-blue-50 text-blue-700 border-blue-200',
  visa: 'bg-orange-50 text-orange-700 border-orange-200',
  hotel: 'bg-slate-100 text-slate-700 border-slate-200',
  group_tour: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  insurance: 'bg-purple-50 text-purple-700 border-purple-200',
  other_service: 'bg-pink-50 text-pink-700 border-pink-200',
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

// ─── helpers ──────────────────────────────────────────────────────────────────

function getBookingDetails(b: BookingRecord): string {
  if (b.type === 'air_ticket') {
    const parts: string[] = [];
    if (b.airline_code) parts.push(b.airline_code);
    else if (b.airline) parts.push(b.airline);
    if (b.route_from && b.route_to) parts.push(`${b.route_from} → ${b.route_to}`);
    else if (b.route) parts.push(b.route);
    return parts.length > 0 ? parts.join(' | ') : b.details || '—';
  }
  if (b.type === 'visa') {
    const parts: string[] = [];
    if (b.visa_country) parts.push(b.visa_country);
    if (b.visa_type) parts.push(b.visa_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    return parts.length > 0 ? parts.join(' · ') : b.details || '—';
  }
  if (b.type === 'hotel') return b.hotel_name || b.details || '—';
  if (b.type === 'group_tour') return b.tour_name || b.details || '—';
  return b.details || '—';
}

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ─── form state type ─────────────────────────────────────────────────────────

type FormType = 'air_ticket' | 'visa' | 'hotel' | 'group_tour' | 'insurance' | 'other_service';

interface BookingForm {
  customer_id: string;
  customer_name: string;
  type: FormType;
  details: string;
  cost_price: string;
  sale_price: string;
  agent_commission: string;
  currency: string;
  payment_status: 'paid' | 'pending' | 'refund';
  process_status: 'pending' | 'processing' | 'approved' | 'rejected' | 'issued';
  agent_id: string;
  agent_name: string;
  date: string;
  issued_by_name: string;
  // Flight Ticket fields
  trip_type: 'one_way' | 'return';
  airline_code: string;
  airline: string;
  pnr: string;
  ticket_number: string;
  route_from: string;
  route_to: string;
  departure_date: string;
  return_date: string;
  passenger_name: string;
  // Visa fields
  visa_country: string;
  visa_type: string;
  application_date: string;
  expected_approval_date: string;
  passport_number: string;
}

const EMPTY_FORM: BookingForm = {
  customer_id: '',
  customer_name: '',
  type: 'air_ticket',
  details: '',
  cost_price: '',
  sale_price: '',
  agent_commission: '',
  currency: 'OMR',
  payment_status: 'pending',
  process_status: 'pending',
  agent_id: '',
  agent_name: '',
  date: new Date().toISOString().split('T')[0],
  issued_by_name: '',
  trip_type: 'one_way',
  airline_code: '',
  airline: '',
  pnr: '',
  ticket_number: '',
  route_from: '',
  route_to: '',
  departure_date: '',
  return_date: '',
  passenger_name: '',
  visa_country: '',
  visa_type: '',
  application_date: '',
  expected_approval_date: '',
  passport_number: '',
};

// ─── label helpers ────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1';
const subLabelCls = 'block text-xs font-medium text-slate-600 mb-1';

// ─── component ───────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const { bookings, loading, create, update, remove, search } = useBookings();
  const { customers } = useCustomers();
  const { agents } = useAgents();
  const { can } = usePermissions();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BookingRecord | null>(null);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);

  // Prevent unused-import lint error for t (useLanguage is required by the context)
  void t;

  const sf = (patch: Partial<BookingForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0] });
    setEditing(null);
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const c = customers.find((x) => x.id === e.target.value);
    sf({ customer_id: e.target.value, customer_name: c?.name ?? '' });
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
      type: b.type as FormType,
      details: b.details,
      cost_price: String(b.cost_price),
      sale_price: String(b.sale_price),
      agent_commission: String(b.agent_commission),
      currency: b.currency,
      payment_status: b.payment_status,
      process_status: b.process_status,
      agent_id: b.agent_id || '',
      agent_name: b.agent_name || '',
      date: b.created_at.split('T')[0],
      issued_by_name: b.issued_by_name || '',
      // Detect return trip from saved return_date
      trip_type: b.return_date ? 'return' : 'one_way',
      // Flight fields
      airline_code: b.airline_code || '',
      airline: b.airline || '',
      pnr: b.pnr || '',
      ticket_number: b.ticket_number || '',
      route_from: b.route_from || '',
      route_to: b.route_to || '',
      departure_date: b.departure_date || '',
      return_date: b.return_date || '',
      passenger_name: b.passenger_name || '',
      // Visa fields
      visa_country: b.visa_country || '',
      visa_type: b.visa_type || '',
      application_date: b.application_date || '',
      expected_approval_date: b.expected_approval_date || '',
      passport_number: b.passport_number || '',
    });
    setEditing(b);
    setSaveError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.customer_id) {
      setSaveError('Please select a customer from the list.');
      return;
    }
    if (!form.sale_price) {
      setSaveError('Sale price is required.');
      return;
    }
    setSaveError(null);

    const salePrice = Number(form.sale_price) || 0;
    const costPrice = Number(form.cost_price) || 0;
    const selectedAgent = agents.find((a) => a.id === form.agent_id);
    const commissionAmount = selectedAgent
      ? calculateCommission(selectedAgent, salePrice, costPrice)
      : 0;

    const isFlightTicket = form.type === 'air_ticket';
    const isVisa = form.type === 'visa';

    const data = {
      customer_id: form.customer_id,
      customer_name: form.customer_name,
      type: form.type,
      details: form.details,
      cost_price: costPrice,
      sale_price: salePrice,
      agent_commission: Number(form.agent_commission) || 0,
      currency: form.currency,
      payment_status: form.payment_status,
      process_status: form.process_status,
      agent_id: form.agent_id || undefined,
      agent_name: form.agent_name,
      notes: '',
      issued_by_name: form.issued_by_name || null,
      commission_amount: commissionAmount,
      // Flight Ticket specific — null out when type changes away
      airline_code: isFlightTicket ? (form.airline_code || null) : null,
      airline: isFlightTicket ? (form.airline || null) : null,
      pnr: isFlightTicket ? (form.pnr || null) : null,
      ticket_number: isFlightTicket ? (form.ticket_number || null) : null,
      route_from: isFlightTicket ? (form.route_from || null) : null,
      route_to: isFlightTicket ? (form.route_to || null) : null,
      departure_date: isFlightTicket ? (form.departure_date || null) : null,
      return_date: (isFlightTicket && form.trip_type === 'return') ? (form.return_date || null) : null,
      passenger_name: (isFlightTicket || isVisa) ? (form.passenger_name || null) : null,
      // Visa specific
      visa_country: isVisa ? (form.visa_country || null) : null,
      visa_type: isVisa ? (form.visa_type || null) : null,
      application_date: isVisa ? (form.application_date || null) : null,
      expected_approval_date: isVisa ? (form.expected_approval_date || null) : null,
      passport_number: isVisa ? (form.passport_number || null) : null,
    };

    try {
      if (editing) {
        await update(editing.id, data);
      } else {
        await create({ ...data, created_by_name: user?.name ?? null });
      }
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save booking. Please try again.');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this booking?')) remove(id);
  };

  const filtered = search(query, filter);
  const hasExportData = filtered.length > 0;

  const exportBookings = () => {
    if (!hasExportData) return;
    const header = [
      'Booking ID', 'Customer', 'Type', 'Details',
      'Sale Price', 'Cost Price', 'Profit', 'Currency',
      'Payment Status', 'Process Status', 'Agent', 'Date',
    ];
    const rows = filtered.map((b) => [
      b.id, b.customer_name, typeLabels[b.type] || b.type,
      getBookingDetails(b), b.sale_price, b.cost_price,
      b.sale_price - b.cost_price, b.currency,
      b.payment_status, b.process_status,
      b.agent_name || '', formatDate(b.created_at),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    downloadFile(`bookings-${new Date().toISOString().split('T')[0]}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const totalRevenue = bookings.reduce((s, b) => s + b.sale_price, 0);
  const totalCost = bookings.reduce((s, b) => s + b.cost_price, 0);
  const totalProfit = totalRevenue - totalCost;
  const pendingCount = bookings.filter((b) => b.payment_status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  const isFlightForm = form.type === 'air_ticket';
  const isVisaForm = form.type === 'visa';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all transactions</p>
        </div>
        {can('create') && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={exportBookings}
              disabled={!hasExportData}
              title={!hasExportData ? 'No bookings to export' : 'Download filtered bookings as CSV'}
            >
              <Filter className="w-4 h-4" /> Export
            </Button>
            <Button variant="primary" className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" /> New Booking
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{bookings.length}</p>
            <p className="text-xs text-slate-500">Total Bookings</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalRevenue, 'OMR')}</p>
            <p className="text-xs text-slate-500">Revenue</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalProfit, 'OMR')}</p>
            <p className="text-xs text-slate-500">Net Profit</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{pendingCount}</p>
            <p className="text-xs text-slate-500">Pending Payments</p>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookings..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', ...BOOKING_TYPES.map((t) => t.id)].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'All' : typeLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {bookings.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#0F172A]">No bookings yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Create your first booking to start tracking transactions.
          </p>
          {can('create') && (
            <Button variant="primary" className="mt-4 gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Create First Booking
            </Button>
          )}
          <p className="text-xs text-slate-400 mt-3">
            Export becomes available after at least one booking matches the current filters.
          </p>
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
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                      {b.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold">
                          {b.customer_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-[#0F172A] text-sm">{b.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${typeColors[b.type] ?? typeColors.other_service}`}>
                        {typeIcons[b.type] ?? typeIcons.other_service}
                        {typeLabels[b.type] ?? b.type}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs max-w-[160px] truncate">
                      {getBookingDetails(b)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#0F172A] text-sm">
                        {formatCurrency(b.sale_price, b.currency)}
                      </p>
                      <p className="text-xs text-slate-400">Cost: {formatCurrency(b.cost_price, b.currency)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[b.payment_status]}`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${processColors[b.process_status]}`}>
                        {b.process_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      <div>{formatDate(b.created_at)}</div>
                      {b.created_by_name && (
                        <div className="text-slate-400 mt-0.5">By: {b.created_by_name}</div>
                      )}
                      {b.issued_by_name && (
                        <div className="text-slate-400 mt-0.5">Issued: {b.issued_by_name}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {can('edit') && (
                          <button
                            onClick={() => openEdit(b)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {can('delete') && (
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && query && (
            <div className="p-8 text-center text-slate-500">
              <p>No results for &ldquo;{query}&rdquo;</p>
              <button onClick={() => setQuery('')} className="text-brand text-sm mt-1 hover:underline">
                Clear search
              </button>
            </div>
          )}
        </Card>
      )}

      {/* ─── Create / Edit Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            {/* Modal header */}
            <div className="sticky top-0 bg-white z-10 pb-4 border-b border-slate-100 flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {editing ? 'Edit Booking' : 'New Booking'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Customer */}
              <div>
                <label className={labelCls}>Customer *</label>
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
                    className={inputCls}
                  >
                    <option value="">— Select customer —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.phone}
                      </option>
                    ))}
                  </select>
                )}
                {editing && form.customer_id && !customers.find((c) => c.id === form.customer_id) && (
                  <p className="text-xs text-amber-600 mt-1">
                    Previous customer &ldquo;{form.customer_name}&rdquo; is no longer in the list.
                  </p>
                )}
              </div>

              {/* Booking Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Booking Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => sf({ type: e.target.value as FormType })}
                    className={inputCls}
                  >
                    {BOOKING_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>General Notes / Details</label>
                  <input
                    value={form.details}
                    onChange={(e) => sf({ details: e.target.value })}
                    className={inputCls}
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              {/* ── Flight Ticket Fields ─────────────────────────────────── */}
              {isFlightForm && (
                <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/20 space-y-3">
                  {/* Header + Trip Type toggle */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-2">
                      <Plane className="w-3.5 h-3.5" /> Flight Details
                    </h3>
                    <div className="flex items-center rounded-lg border border-blue-200 overflow-hidden text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => sf({ trip_type: 'one_way', return_date: '' })}
                        className={`px-3 py-1.5 transition-colors ${
                          form.trip_type === 'one_way'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        One Way
                      </button>
                      <button
                        type="button"
                        onClick={() => sf({ trip_type: 'return' })}
                        className={`px-3 py-1.5 transition-colors border-l border-blue-200 ${
                          form.trip_type === 'return'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        Return
                      </button>
                    </div>
                  </div>

                  {/* Airline + Airline Code */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={subLabelCls}>Airline</label>
                      <Combobox
                        options={AIRLINE_OPTIONS}
                        value={form.airline_code}
                        onChange={(code) => {
                          const found = getAirlineByCode(code);
                          sf({ airline_code: code, airline: found?.name ?? '' });
                        }}
                        placeholder="Select airline"
                      />
                    </div>
                    <div>
                      <label className={subLabelCls}>Airline Code</label>
                      <input
                        value={form.airline_code}
                        onChange={(e) => sf({ airline_code: e.target.value.toUpperCase() })}
                        className={inputCls}
                        placeholder="e.g. EK"
                        maxLength={3}
                      />
                    </div>
                  </div>

                  {/* PNR + Ticket Number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={subLabelCls}>PNR</label>
                      <input
                        value={form.pnr}
                        onChange={(e) => sf({ pnr: e.target.value.toUpperCase() })}
                        className={inputCls}
                        placeholder="e.g. ABC123"
                      />
                    </div>
                    <div>
                      <label className={subLabelCls}>Ticket Number</label>
                      <input
                        value={form.ticket_number}
                        onChange={(e) => sf({ ticket_number: e.target.value })}
                        className={inputCls}
                        placeholder="e.g. 176-1234567890"
                      />
                    </div>
                  </div>

                  {/* Route From + Route To */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={subLabelCls}>Route From</label>
                      <Combobox
                        options={AIRPORT_OPTIONS}
                        value={form.route_from}
                        onChange={(v) => sf({ route_from: v })}
                        placeholder="Origin airport"
                      />
                    </div>
                    <div>
                      <label className={subLabelCls}>Route To</label>
                      <Combobox
                        options={AIRPORT_OPTIONS}
                        value={form.route_to}
                        onChange={(v) => sf({ route_to: v })}
                        placeholder="Destination airport"
                      />
                    </div>
                  </div>

                  {/* Departure Date — always shown. Return Date — only when Return selected */}
                  <div className={`grid gap-3 ${form.trip_type === 'return' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                    <div>
                      <label className={subLabelCls}>Departure Date</label>
                      <input
                        type="date"
                        value={form.departure_date}
                        onChange={(e) => sf({ departure_date: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    {form.trip_type === 'return' && (
                      <div>
                        <label className={subLabelCls}>Return Date</label>
                        <input
                          type="date"
                          value={form.return_date}
                          onChange={(e) => sf({ return_date: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                    )}
                  </div>

                  {/* Passenger Name */}
                  <div>
                    <label className={subLabelCls}>Passenger Name</label>
                    <input
                      value={form.passenger_name}
                      onChange={(e) => sf({ passenger_name: e.target.value })}
                      className={inputCls}
                      placeholder="Full name as on passport"
                    />
                  </div>
                </div>
              )}

              {/* ── Visa Fields ──────────────────────────────────────────── */}
              {isVisaForm && (
                <div className="border border-orange-100 rounded-xl p-4 bg-orange-50/20 space-y-3">
                  <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Visa Details
                  </h3>

                  {/* Visa Country + Visa Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={subLabelCls}>Visa Country</label>
                      <Combobox
                        options={COUNTRY_OPTIONS}
                        value={form.visa_country}
                        onChange={(v) => sf({ visa_country: v })}
                        placeholder="Select country"
                      />
                    </div>
                    <div>
                      <label className={subLabelCls}>Visa Type</label>
                      <select
                        value={form.visa_type}
                        onChange={(e) => sf({ visa_type: e.target.value })}
                        className={inputCls}
                      >
                        <option value="">— Select type —</option>
                        {VISA_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Application Date + Expected Approval Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={subLabelCls}>Application Date</label>
                      <input
                        type="date"
                        value={form.application_date}
                        onChange={(e) => sf({ application_date: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={subLabelCls}>Expected Approval Date</label>
                      <input
                        type="date"
                        value={form.expected_approval_date}
                        onChange={(e) => sf({ expected_approval_date: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Passport Number + Passenger Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={subLabelCls}>Passport Number</label>
                      <input
                        value={form.passport_number}
                        onChange={(e) => sf({ passport_number: e.target.value.toUpperCase() })}
                        className={inputCls}
                        placeholder="e.g. A12345678"
                      />
                    </div>
                    <div>
                      <label className={subLabelCls}>Passenger Name</label>
                      <input
                        value={form.passenger_name}
                        onChange={(e) => sf({ passenger_name: e.target.value })}
                        className={inputCls}
                        placeholder="Full name as on passport"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Cost Price</label>
                  <input
                    type="number"
                    value={form.cost_price}
                    onChange={(e) => sf({ cost_price: e.target.value })}
                    className={inputCls}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelCls}>Sale Price *</label>
                  <input
                    type="number"
                    value={form.sale_price}
                    onChange={(e) => sf({ sale_price: e.target.value })}
                    className={inputCls}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelCls}>Commission %</label>
                  <input
                    type="number"
                    value={form.agent_commission}
                    onChange={(e) => sf({ agent_commission: e.target.value })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => sf({ currency: e.target.value })}
                    className={inputCls}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ownership */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5" /> Ownership
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={subLabelCls}>Assigned Agent</label>
                    <select
                      value={form.agent_id}
                      onChange={(e) => {
                        const a = agents.find((x) => x.id === e.target.value);
                        sf({
                          agent_id: e.target.value,
                          agent_name: a?.name ?? '',
                          agent_commission: a ? String(a.commission_rate) : form.agent_commission,
                        });
                      }}
                      className={`${inputCls} bg-white`}
                    >
                      <option value="">— No agent —</option>
                      {agents.filter((a) => a.active).map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={subLabelCls}>Issued By</label>
                    <input
                      value={form.issued_by_name}
                      onChange={(e) => sf({ issued_by_name: e.target.value })}
                      className={inputCls}
                      placeholder="Ticketing staff name"
                    />
                  </div>
                </div>
                {!editing && user?.name && (
                  <p className="text-xs text-slate-400">
                    Created by: <span className="font-medium text-slate-600">{user.name}</span> (auto-recorded)
                  </p>
                )}
                {form.agent_id && (() => {
                  const a = agents.find((x) => x.id === form.agent_id);
                  if (!a) return null;
                  const commission = calculateCommission(
                    a,
                    Number(form.sale_price) || 0,
                    Number(form.cost_price) || 0,
                  );
                  return (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                      Commission: <strong>{commission.toFixed(3)} OMR</strong> (
                      {a.commission_type === 'fixed'
                        ? 'fixed'
                        : `${a.commission_rate}% of ${a.commission_base === 'profit' ? 'profit' : 'sale'}`}
                      )
                    </p>
                  );
                })()}
              </div>

              {/* Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Payment</label>
                  <select
                    value={form.payment_status}
                    onChange={(e) => sf({ payment_status: e.target.value as BookingForm['payment_status'] })}
                    className={inputCls}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Process</label>
                  <select
                    value={form.process_status}
                    onChange={(e) => sf({ process_status: e.target.value as BookingForm['process_status'] })}
                    className={inputCls}
                  >
                    {PROCESS_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => sf({ date: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {saveError && (
              <div className="mt-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {saveError}
              </div>
            )}

            <div className="sticky bottom-0 bg-white pt-4 mt-4 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" /> Save Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
