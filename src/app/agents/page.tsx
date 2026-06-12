'use client';

import React, { useState } from 'react';
import { useAgents, AgentRecord } from '@/hooks/useDataStore';
import { useBookings } from '@/hooks/useDataStore';
import { usePermissions } from '@/hooks/useDataStore';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Plus, X, Save, Edit2, Trash2, TrendingUp, DollarSign, Users, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AgentsPage() {
  const { agents, loading, create, update, remove, recalculateCommissions } = useAgents();
  const { bookings } = useBookings();
  const { can } = usePermissions();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AgentRecord | null>(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', commission_rate: '8' });

  const resetForm = () => { setForm({ name: '', email: '', phone: '', commission_rate: '8' }); setEditing(null); };
  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (a: AgentRecord) => { setForm({ name: a.name, email: a.email, phone: a.phone, commission_rate: String(a.commission_rate) }); setEditing(a); setShowModal(true); };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editing) {
      update(editing.id, { name: form.name, email: form.email, phone: form.phone, commission_rate: Number(form.commission_rate) });
    } else {
      create({ name: form.name, email: form.email, phone: form.phone, commission_rate: Number(form.commission_rate), active: true });
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => { if (confirm('Delete this agent?')) remove(id); };
  const handleRecalculate = () => { recalculateCommissions(bookings); };

  const filtered = agents.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.email.toLowerCase().includes(query.toLowerCase()));
  const totalSales = agents.reduce((s, a) => s + a.total_sales, 0);
  const totalEarned = agents.reduce((s, a) => s + a.commission_earned, 0);
  const totalPaid = agents.reduce((s, a) => s + a.commission_paid, 0);
  const totalPending = totalEarned - totalPaid;

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#0F172A]">Agents & Commissions</h1><p className="text-sm text-slate-500 mt-1">Track performance and commissions</p></div>
        <div className="flex items-center gap-2">
          {can('manage') && <Button variant="outline" className="gap-2" onClick={handleRecalculate}><TrendingUp className="w-4 h-4" /> Recalculate</Button>}
          {can('create') && <Button variant="primary" className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> Add Agent</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Users className="w-5 h-5" /></div><div><p className="text-2xl font-bold text-[#0F172A]">{agents.length}</p><p className="text-xs text-slate-500">Total Agents</p></div></Card>
        <Card className="p-4 flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><DollarSign className="w-5 h-5" /></div><div><p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalSales, 'OMR')}</p><p className="text-xs text-slate-500">Total Sales</p></div></Card>
        <Card className="p-4 flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange"><Award className="w-5 h-5" /></div><div><p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalEarned, 'OMR')}</p><p className="text-xs text-slate-500">Earned</p></div></Card>
        <Card className="p-4 flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><DollarSign className="w-5 h-5" /></div><div><p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalPending, 'OMR')}</p><p className="text-xs text-slate-500">Pending</p></div></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agents..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50" />
      </div>

      {agents.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-slate-400" /></div>
          <h3 className="text-lg font-semibold text-[#0F172A]">No agents yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Add your first agent to start tracking commissions and performance.</p>
          {can('create') && <Button variant="primary" className="mt-4 gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> Add First Agent</Button>}
        </div>
      )}

      {agents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Agent</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Rate</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Sales</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Earned</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Paid</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase">Pending</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-deep-blue/10 flex items-center justify-center text-deep-blue font-semibold text-sm">{a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                            <div><p className="font-medium text-[#0F172A] text-sm">{a.name}</p><p className="text-xs text-slate-500">{a.email}</p></div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{a.commission_rate}%</td>
                        <td className="px-5 py-4 font-medium text-[#0F172A]">{formatCurrency(a.total_sales, 'OMR')}</td>
                        <td className="px-5 py-4 text-emerald-600 font-medium">{formatCurrency(a.commission_earned, 'OMR')}</td>
                        <td className="px-5 py-4 text-slate-600">{formatCurrency(a.commission_paid, 'OMR')}</td>
                        <td className="px-5 py-4 text-brand-orange font-medium">{formatCurrency(a.commission_earned - a.commission_paid, 'OMR')}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {can('edit') && <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>}
                            {can('delete') && <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && query && <div className="p-8 text-center text-slate-500"><p>No results for "{query}"</p></div>}
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Top Performers</h3>
              <div className="space-y-3">
                {agents.sort((a, b) => b.total_sales - a.total_sales).slice(0, 3).map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-[#0F172A] truncate">{a.name}</p><p className="text-xs text-slate-500">{formatCurrency(a.total_sales, 'OMR')} sales</p></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Total Earned</span><span className="font-semibold text-[#0F172A]">{formatCurrency(totalEarned, 'OMR')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Paid Out</span><span className="font-semibold text-emerald-600">{formatCurrency(totalPaid, 'OMR')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Pending</span><span className="font-semibold text-brand-orange">{formatCurrency(totalPending, 'OMR')}</span></div>
                <div className="border-t border-slate-100 pt-2 flex justify-between font-semibold"><span className="text-[#0F172A]">Net Payable</span><span className="text-brand">{formatCurrency(totalPending, 'OMR')}</span></div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-[#0F172A]">{editing ? 'Edit Agent' : 'Add Agent'}</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Agent name" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="agent@email.com" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="+968 0000 0000" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Commission Rate (%)</label><input type="number" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="8" /></div>
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
