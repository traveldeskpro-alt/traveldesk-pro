'use client';

import React, { useState, useMemo } from 'react';
import {
  useAgents, useStaff, useBookings, usePermissions,
  AgentRecord, calculateCommission,
} from '@/hooks/useDataStore';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ROLES, COMMISSION_TYPES, COMMISSION_BASES } from '@/lib/constants';
import {
  UserCheck, Users, Plus, Edit2, Trash2, X, Save,
  CheckCircle, AlertCircle, TrendingUp, DollarSign,
  Clock, Download,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────

function csvCell(v: string | number | null | undefined) {
  const s = v == null ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

const EDITABLE_ROLES = ROLES.filter((r) => r.id !== 'super_admin');

const roleBadgeColor: Record<string, string> = {
  owner: 'bg-purple-50 text-purple-700 border-purple-200',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ticketing_staff: 'bg-sky-50 text-sky-700 border-sky-200',
  sales_staff: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  accountant: 'bg-amber-50 text-amber-700 border-amber-200',
  agent: 'bg-teal-50 text-teal-700 border-teal-200',
  viewer: 'bg-slate-50 text-slate-600 border-slate-200',
};

function getRoleLabel(id: string) {
  return ROLES.find((r) => r.id === id)?.label ?? id;
}

// ─── Agent commission stats derived from bookings ─────────────────────────────

function useAgentStats(agentId: string, bookings: ReturnType<typeof useBookings>['bookings']) {
  return useMemo(() => {
    const ab = bookings.filter((b) => b.agent_id === agentId);
    const earned = ab.reduce((s, b) => s + (b.commission_amount ?? 0), 0);
    const paid = ab
      .filter((b) => b.commission_paid)
      .reduce((s, b) => s + (b.commission_amount ?? 0), 0);
    return {
      bookingCount: ab.length,
      totalSales: ab.reduce((s, b) => s + b.sale_price, 0),
      totalProfit: ab.reduce((s, b) => s + (b.sale_price - b.cost_price), 0),
      earned,
      paid,
      pending: earned - paid,
    };
  }, [agentId, bookings]);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <Card className={`p-4 flex items-center gap-4 ${color}`}>
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-[#0F172A] truncate">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { t } = useLanguage();
  const { agents, loading: agentsLoading, create: createAgent, update: updateAgent, remove: removeAgent } = useAgents();
  const { staff, loading: staffLoading, create: createStaff, update: updateStaff } = useStaff();
  const { bookings, markAgentCommissionPaid } = useBookings();

  const [tab, setTab] = useState<'agents' | 'staff'>('agents');

  // ── Agent modal state ──────────────────────────────────────────────────────
  const [agentModal, setAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentRecord | null>(null);
  const [agentForm, setAgentForm] = useState({
    name: '', email: '', phone: '',
    commission_type: 'percentage' as 'percentage' | 'fixed',
    commission_base: 'profit' as 'profit' | 'total_sale' | 'service_fee',
    commission_rate: '',
    active: true,
  });
  const [agentSaving, setAgentSaving] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  // ── Mark commission paid modal ─────────────────────────────────────────────
  const [payModal, setPayModal] = useState<AgentRecord | null>(null);
  const [payDate, setPayDate] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // ── Staff modal state ──────────────────────────────────────────────────────
  const [staffModal, setStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<typeof staff[0] | null>(null);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '', role: 'viewer', active: true });
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // ── Aggregate stats across all agents ─────────────────────────────────────
  const totals = useMemo(() => {
    const totalEarned = bookings.reduce((s, b) => s + (b.commission_amount ?? 0), 0);
    const totalPaid = bookings
      .filter((b) => b.commission_paid)
      .reduce((s, b) => s + (b.commission_amount ?? 0), 0);
    return {
      activeAgents: agents.filter((a) => a.active).length,
      totalEarned,
      totalPaid,
      totalPending: totalEarned - totalPaid,
    };
  }, [agents, bookings]);

  // ── Agent handlers ─────────────────────────────────────────────────────────
  const openCreateAgent = () => {
    setEditingAgent(null);
    setAgentForm({ name: '', email: '', phone: '', commission_type: 'percentage', commission_base: 'profit', commission_rate: '', active: true });
    setAgentError(null);
    setAgentModal(true);
  };

  const openEditAgent = (a: AgentRecord) => {
    setEditingAgent(a);
    setAgentForm({
      name: a.name, email: a.email, phone: a.phone,
      commission_type: a.commission_type ?? 'percentage',
      commission_base: a.commission_base ?? 'profit',
      commission_rate: String(a.commission_rate),
      active: a.active,
    });
    setAgentError(null);
    setAgentModal(true);
  };

  const saveAgent = async () => {
    if (!agentForm.name.trim() || !agentForm.email.trim()) {
      setAgentError('Name and email are required.'); return;
    }
    setAgentError(null);
    setAgentSaving(true);
    try {
      const payload = {
        name: agentForm.name.trim(),
        email: agentForm.email.trim(),
        phone: agentForm.phone.trim(),
        commission_type: agentForm.commission_type,
        commission_base: agentForm.commission_base,
        commission_rate: Number(agentForm.commission_rate) || 0,
        active: agentForm.active,
      };
      if (editingAgent) {
        await updateAgent(editingAgent.id, payload);
      } else {
        await createAgent(payload);
      }
      setAgentModal(false);
    } catch (err: unknown) {
      setAgentError(err instanceof Error ? err.message : 'Failed to save agent.');
    } finally {
      setAgentSaving(false);
    }
  };

  const handleDeleteAgent = (id: string) => {
    if (confirm('Delete this agent? This cannot be undone.')) removeAgent(id);
  };

  // ── Mark commission paid ───────────────────────────────────────────────────
  const openPayModal = (a: AgentRecord) => {
    setPayModal(a);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayNotes('');
    setPayError(null);
  };

  const handleMarkPaid = async () => {
    if (!payModal) return;
    if (!payDate) { setPayError('Payment date is required.'); return; }
    setPaying(true);
    setPayError(null);
    try {
      await markAgentCommissionPaid(payModal.id, new Date(`${payDate}T00:00:00.000Z`).toISOString(), payNotes);
      setPayModal(null);
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Failed to mark commission paid.');
    } finally {
      setPaying(false);
    }
  };

  // ── Staff handlers ─────────────────────────────────────────────────────────
  const openCreateStaff = () => {
    setEditingStaff(null);
    setStaffForm({ name: '', email: '', phone: '', role: 'viewer', active: true });
    setStaffError(null);
    setStaffModal(true);
  };

  const openEditStaff = (s: typeof staff[0]) => {
    setEditingStaff(s);
    setStaffForm({ name: s.name, email: s.email, phone: s.phone ?? '', role: s.role, active: s.active });
    setStaffError(null);
    setStaffModal(true);
  };

  const saveStaff = async () => {
    if (!staffForm.name.trim() || !staffForm.email.trim()) {
      setStaffError('Name and email are required.'); return;
    }
    if (editingStaff?.id === user?.id && staffForm.role !== user?.role) {
      setStaffError('You cannot change your own role.'); return;
    }
    setStaffError(null);
    setStaffSaving(true);
    try {
      const payload = {
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        phone: staffForm.phone.trim() || undefined,
        role: staffForm.role,
        active: staffForm.active,
      };
      if (editingStaff) {
        await updateStaff(editingStaff.id, payload);
      } else {
        await createStaff(payload);
      }
      setStaffModal(false);
    } catch (err: unknown) {
      setStaffError(err instanceof Error ? err.message : 'Failed to save staff member.');
    } finally {
      setStaffSaving(false);
    }
  };

  // ── CSV / Excel export ─────────────────────────────────────────────────────
  const exportCsv = () => {
    const header = ['Agent', 'Email', 'Phone', 'Commission Type', 'Rate', 'Bookings', 'Sales', 'Profit', 'Earned', 'Paid', 'Pending', 'Status'];
    const rows = agents.map((a) => {
      const ab = bookings.filter((b) => b.agent_id === a.id);
      const earned = ab.reduce((s, b) => s + (b.commission_amount ?? 0), 0);
      const paid = ab.filter((b) => b.commission_paid).reduce((s, b) => s + (b.commission_amount ?? 0), 0);
      return [
        a.name, a.email, a.phone,
        a.commission_type === 'fixed' ? 'Fixed' : 'Percentage',
        a.commission_rate,
        ab.length,
        ab.reduce((s, b) => s + b.sale_price, 0),
        ab.reduce((s, b) => s + (b.sale_price - b.cost_price), 0),
        earned, paid, earned - paid,
        a.active ? 'Active' : 'Inactive',
      ];
    });
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
    downloadFile(`agent-performance-${new Date().toISOString().split('T')[0]}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const exportExcel = () => {
    const rows = [
      ['Agent', 'Email', 'Phone', 'Commission Type', 'Rate', 'Bookings', 'Sales', 'Profit', 'Earned', 'Paid', 'Pending', 'Status'],
      ...agents.map((a) => {
        const ab = bookings.filter((b) => b.agent_id === a.id);
        const earned = ab.reduce((s, b) => s + (b.commission_amount ?? 0), 0);
        const paid = ab.filter((b) => b.commission_paid).reduce((s, b) => s + (b.commission_amount ?? 0), 0);
        return [
          a.name, a.email, a.phone,
          a.commission_type === 'fixed' ? 'Fixed' : 'Percentage',
          a.commission_rate,
          ab.length,
          ab.reduce((s, b) => s + b.sale_price, 0),
          ab.reduce((s, b) => s + (b.sale_price - b.cost_price), 0),
          earned, paid, earned - paid,
          a.active ? 'Active' : 'Inactive',
        ];
      }),
    ];
    const html = `<table>${rows.map((r) => `<tr>${r.map((c) => `<td>${String(c)}</td>`).join('')}</tr>`).join('')}</table>`;
    downloadFile(`agent-performance-${new Date().toISOString().split('T')[0]}.xls`, html, 'application/vnd.ms-excel;charset=utf-8');
  };

  const isLoading = agentsLoading || staffLoading;

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">{t('agents')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage commission agents and agency staff</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setTab('agents')}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${tab === 'agents' ? 'bg-white dark:bg-slate-800 border border-b-white dark:border-b-slate-800 border-slate-200 dark:border-slate-700 text-brand -mb-px' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <span className="flex items-center gap-2"><UserCheck className="w-4 h-4" /> Commission Agents</span>
        </button>
        <button
          onClick={() => setTab('staff')}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${tab === 'staff' ? 'bg-white dark:bg-slate-800 border border-b-white dark:border-b-slate-800 border-slate-200 dark:border-slate-700 text-brand -mb-px' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Staff Members</span>
        </button>
      </div>

      {/* ═══ AGENTS TAB ═══ */}
      {tab === 'agents' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Active Agents" value={String(totals.activeAgents)} icon={UserCheck} color="" />
            <StatCard label="Total Earned" value={formatCurrency(totals.totalEarned, 'OMR')} icon={TrendingUp} color="" />
            <StatCard label="Total Paid" value={formatCurrency(totals.totalPaid, 'OMR')} icon={CheckCircle} color="" />
            <StatCard label="Total Pending" value={formatCurrency(totals.totalPending, 'OMR')} icon={Clock} color="" />
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-2">
              {can('create') && (
                <Button variant="primary" className="gap-2" onClick={openCreateAgent}>
                  <Plus className="w-4 h-4" /> New Agent
                </Button>
              )}
              {agents.length > 0 && (
                <>
                  <Button variant="outline" className="gap-2" onClick={exportCsv}>
                    <Download className="w-4 h-4" /> CSV
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={exportExcel}>
                    <Download className="w-4 h-4" /> Excel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Empty state */}
          {agents.length === 0 && (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/50">
              <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">No agents yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Add commission agents to track bookings, sales, and payouts.
              </p>
              {can('create') && (
                <Button variant="primary" className="mt-4 gap-2" onClick={openCreateAgent}>
                  <Plus className="w-4 h-4" /> Add First Agent
                </Button>
              )}
            </div>
          )}

          {/* Agents table */}
          {agents.length > 0 && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Agent</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Commission</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Bookings</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Earned</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Paid</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Pending</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {agents.map((a) => (
                      <AgentRow
                        key={a.id}
                        agent={a}
                        bookings={bookings}
                        canEdit={can('edit')}
                        canDelete={can('delete')}
                        canAdmin={can('admin')}
                        onEdit={() => openEditAgent(a)}
                        onDelete={() => handleDeleteAgent(a.id)}
                        onMarkPaid={() => openPayModal(a)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══ STAFF TAB ═══ */}
      {tab === 'staff' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">{staff.length} staff member{staff.length !== 1 ? 's' : ''} in this agency</p>
            {can('admin') && (
              <Button variant="primary" className="gap-2" onClick={openCreateStaff}>
                <Plus className="w-4 h-4" /> Add Staff Member
              </Button>
            )}
          </div>

          {staff.length === 0 && (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/50">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">No staff members</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add staff to manage roles and access.</p>
            </div>
          )}

          {staff.length > 0 && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Name</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Email</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Phone</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Role</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Created</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {staff.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold shrink-0">
                              {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-[#0F172A] dark:text-white">{s.name}</span>
                            {s.id === user?.id && (
                              <span className="text-xs text-slate-400">(you)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm">{s.email}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm">{s.phone || '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${roleBadgeColor[s.role] ?? 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>
                            {getRoleLabel(s.role)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${s.active ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                            {s.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(s.created_at)}</td>
                        <td className="px-5 py-4 text-right">
                          {can('admin') && (
                            <button onClick={() => openEditStaff(s)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-brand transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══ AGENT CREATE/EDIT MODAL ═══ */}
      {agentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAgentModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">{editingAgent ? 'Edit Agent' : 'New Commission Agent'}</h2>
              <button onClick={() => setAgentModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input value={agentForm.name} onChange={(e) => setAgentForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Agent name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                  <input type="email" value={agentForm.email} onChange={(e) => setAgentForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="agent@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input value={agentForm.phone} onChange={(e) => setAgentForm((p) => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="+968 9000 0000" />
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/40 dark:bg-slate-800/40 space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Commission Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
                    <select value={agentForm.commission_type} onChange={(e) => setAgentForm((p) => ({ ...p, commission_type: e.target.value as 'percentage' | 'fixed' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                      {COMMISSION_TYPES.map((ct) => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {agentForm.commission_type === 'fixed' ? 'Amount (OMR)' : 'Rate (%)'}
                    </label>
                    <input type="number" min={0} step={agentForm.commission_type === 'fixed' ? 0.1 : 0.01} value={agentForm.commission_rate} onChange={(e) => setAgentForm((p) => ({ ...p, commission_rate: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Base</label>
                    <select
                      value={agentForm.commission_base}
                      onChange={(e) => setAgentForm((p) => ({ ...p, commission_base: e.target.value as 'profit' | 'total_sale' | 'service_fee' }))}
                      disabled={agentForm.commission_type === 'fixed'}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50"
                    >
                      {COMMISSION_BASES.map((cb) => <option key={cb.id} value={cb.id}>{cb.label}</option>)}
                    </select>
                  </div>
                </div>

                {agentForm.commission_type === 'percentage' && agentForm.commission_rate && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
                    <strong>Example:</strong> A booking with{' '}
                    {agentForm.commission_base === 'profit' ? 'profit of 100 OMR' : 'sale price of 500 OMR'}{' '}
                    earns <strong>{((Number(agentForm.commission_rate) / 100) * (agentForm.commission_base === 'profit' ? 100 : 500)).toFixed(3)} OMR</strong> commission.
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={agentForm.active} onChange={(e) => setAgentForm((p) => ({ ...p, active: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand" />
                Active agent
              </label>

              {agentError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {agentError}
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAgentModal(false)} disabled={agentSaving}>Cancel</Button>
              <Button variant="primary" onClick={saveAgent} className="gap-2" disabled={agentSaving}>
                <Save className="w-4 h-4" /> {agentSaving ? 'Saving…' : 'Save Agent'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MARK COMMISSION PAID MODAL ═══ */}
      {payModal && (
        <PayCommissionModal
          agent={payModal}
          bookings={bookings}
          payDate={payDate}
          payNotes={payNotes}
          paying={paying}
          payError={payError}
          onDateChange={setPayDate}
          onNotesChange={setPayNotes}
          onConfirm={handleMarkPaid}
          onClose={() => setPayModal(null)}
        />
      )}

      {/* ═══ STAFF CREATE/EDIT MODAL ═══ */}
      {staffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setStaffModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
              <button onClick={() => setStaffModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input value={staffForm.name} onChange={(e) => setStaffForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                <input type="email" value={staffForm.email} onChange={(e) => setStaffForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="staff@agency.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                <input value={staffForm.phone} onChange={(e) => setStaffForm((p) => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="+968 9000 0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm((p) => ({ ...p, role: e.target.value }))}
                  disabled={editingStaff?.id === user?.id}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50"
                >
                  {EDITABLE_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={staffForm.active}
                  onChange={(e) => setStaffForm((p) => ({ ...p, active: e.target.checked }))}
                  disabled={editingStaff?.id === user?.id}
                  className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand disabled:opacity-50"
                />
                Active
              </label>
              {staffError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {staffError}
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStaffModal(false)} disabled={staffSaving}>Cancel</Button>
              <Button variant="primary" onClick={saveStaff} className="gap-2" disabled={staffSaving}>
                <Save className="w-4 h-4" /> {staffSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agent table row (extracted to keep parent component readable) ─────────────

function AgentRow({
  agent, bookings, canEdit, canDelete, canAdmin, onEdit, onDelete, onMarkPaid,
}: {
  agent: AgentRecord;
  bookings: ReturnType<typeof useBookings>['bookings'];
  canEdit: boolean;
  canDelete: boolean;
  canAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
}) {
  const stats = useAgentStats(agent.id, bookings);

  const commissionLabel = agent.commission_type === 'fixed'
    ? `${agent.commission_rate} OMR fixed`
    : `${agent.commission_rate}% of ${agent.commission_base === 'profit' ? 'profit' : agent.commission_base === 'total_sale' ? 'sale' : 'fee'}`;

  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold shrink-0">
            {agent.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-[#0F172A] dark:text-white text-sm">{agent.name}</p>
            <p className="text-xs text-slate-400">{agent.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="text-xs font-medium text-slate-700">{commissionLabel}</span>
      </td>
      <td className="px-5 py-4 text-right text-sm font-medium text-[#0F172A] dark:text-white">{stats.bookingCount}</td>
      <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-700">{formatCurrency(stats.earned, 'OMR')}</td>
      <td className="px-5 py-4 text-right text-sm text-slate-600">{formatCurrency(stats.paid, 'OMR')}</td>
      <td className="px-5 py-4 text-right">
        <span className={`text-sm font-semibold ${stats.pending > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
          {formatCurrency(stats.pending, 'OMR')}
        </span>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${agent.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
          {agent.active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {canAdmin && stats.pending > 0 && (
            <button onClick={onMarkPaid} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors" title="Mark commission paid">
              <DollarSign className="w-4 h-4" />
            </button>
          )}
          {canEdit && (
            <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-brand transition-colors" title="Edit">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button onClick={onDelete} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Pay Commission Modal ──────────────────────────────────────────────────────

function PayCommissionModal({
  agent, bookings, payDate, payNotes, paying, payError,
  onDateChange, onNotesChange, onConfirm, onClose,
}: {
  agent: AgentRecord;
  bookings: ReturnType<typeof useBookings>['bookings'];
  payDate: string;
  payNotes: string;
  paying: boolean;
  payError: string | null;
  onDateChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const stats = useAgentStats(agent.id, bookings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">Mark Commission Paid</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{agent.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Earned</p>
              <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formatCurrency(stats.earned, 'OMR')}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Already Paid</p>
              <p className="text-sm font-bold text-emerald-700">{formatCurrency(stats.paid, 'OMR')}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-500/20">
              <p className="text-xs text-amber-600 mb-1">Pending</p>
              <p className="text-sm font-bold text-amber-700">{formatCurrency(stats.pending, 'OMR')}</p>
            </div>
          </div>

          {stats.pending <= 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
              No pending commission for this agent.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Date *</label>
                <DatePicker value={payDate} onChange={onDateChange} placeholder="Select date" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (optional)</label>
                <textarea value={payNotes} onChange={(e) => onNotesChange(e.target.value)} rows={2} placeholder="e.g. Bank transfer ref #12345" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
              </div>
              <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-400">
                This will mark all <strong>{stats.pending > 0 ? bookings.filter((b) => b.agent_id === agent.id && !b.commission_paid && (b.commission_amount ?? 0) > 0).length : 0}</strong> unpaid booking commission(s) as paid with the date above.
              </div>
            </>
          )}

          {payError && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {payError}
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={paying}>Cancel</Button>
          {stats.pending > 0 && (
            <Button variant="primary" onClick={onConfirm} className="gap-2" disabled={paying}>
              <CheckCircle className="w-4 h-4" /> {paying ? 'Saving…' : `Mark ${formatCurrency(stats.pending, 'OMR')} Paid`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
