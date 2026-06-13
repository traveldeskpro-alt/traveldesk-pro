'use client';

import React, { useState } from 'react';
import { useCustomers, CustomerRecord } from '@/hooks/useDataStore';
import { usePermissions } from '@/hooks/useDataStore';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Phone, Mail, MapPin, Edit2, Trash2, X, Save, Users, UserCheck, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CustomersPage() {
  const { customers, loading, create, update, remove, search } = useCustomers();
  const { can } = usePermissions();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);

  const [form, setForm] = useState({
    name: '', phone: '', whatsapp: '', email: '',
    passport_number: '', passport_expiry: '', nationality: '', notes: '',
  });

  const resetForm = () => {
    setForm({ name: '', phone: '', whatsapp: '', email: '', passport_number: '', passport_expiry: '', nationality: '', notes: '' });
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (c: CustomerRecord) => {
    setForm({
      name: c.name, phone: c.phone, whatsapp: c.whatsapp || '', email: c.email,
      passport_number: c.passport_number || '', passport_expiry: c.passport_expiry || '',
      nationality: c.nationality, notes: c.notes || '',
    });
    setEditing(c);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.phone || !form.email) return;
    if (editing) {
      update(editing.id, form);
    } else {
      create(form);
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this customer? This cannot be undone.')) remove(id);
  };

  const filtered = search(query);
  const totalBookings = customers.reduce((s, c) => s + c.total_bookings, 0);
  const totalSpend = customers.reduce((s, c) => s + c.total_spend, 0);

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
          <h1 className="text-2xl font-bold text-[#0F172A]">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your customer database</p>
        </div>
        {can('create') && (
          <Button variant="primary" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Customer
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Users className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-[#0F172A]">{customers.length}</p><p className="text-xs text-slate-500">Total Customers</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><UserCheck className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-[#0F172A]">{customers.filter(c => c.total_bookings > 0).length}</p><p className="text-xs text-slate-500">Active</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><DollarSign className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-[#0F172A]">{totalBookings}</p><p className="text-xs text-slate-500">Total Bookings</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><DollarSign className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalSpend, 'OMR')}</p><p className="text-xs text-slate-500">Total Spend</p></div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, email, passport..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50"
        />
      </div>

      {/* Empty State */}
      {customers.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#0F172A]">No customers yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Add your first customer to start tracking bookings and building your database.</p>
          {can('create') && (
            <Button variant="primary" className="mt-4 gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Add First Customer
            </Button>
          )}
        </div>
      )}

      {/* Customer Table */}
      {customers.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Customer</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Contact</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Passport</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Bookings</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Spend</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold text-sm">
                          {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-[#0F172A]">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.nationality}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs"><Phone className="w-3.5 h-3.5" /> {c.phone}</div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs"><Mail className="w-3.5 h-3.5" /> {c.email}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-xs">{c.passport_number || '—'}</td>
                    <td className="px-5 py-4 text-[#0F172A] font-semibold">{c.total_bookings}</td>
                    <td className="px-5 py-4 text-[#0F172A] font-medium">{formatCurrency(c.total_spend, 'OMR')}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {can('edit') && (
                          <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {can('delete') && (
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0F172A]">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Ahmed Al Rashdi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="+968 9000 0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="+968 9000 0000" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="customer@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label>
                <input value={form.passport_number} onChange={(e) => setForm({ ...form, passport_number: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="A1234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passport Expiry</label>
                <input type="date" value={form.passport_expiry} onChange={(e) => setForm({ ...form, passport_expiry: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label>
                <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Omani" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" placeholder="Additional notes..." />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} className="gap-2"><Save className="w-4 h-4" /> Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
