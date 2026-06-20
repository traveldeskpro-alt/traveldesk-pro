'use client';

import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/hooks/useDataStore';
import { useCustomers } from '@/hooks/useDataStore';
import { useAgents } from '@/hooks/useDataStore';
import { useInvoices } from '@/hooks/useDataStore';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, CreditCard, Briefcase, Users, UserCheck,
  ArrowUpRight, ArrowDownRight, CalendarDays, Plane, FileText, Plus
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { bookings, loading: bookingsLoading } = useBookings();
  const { customers, loading: customersLoading } = useCustomers();
  const { agents, loading: agentsLoading } = useAgents();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { language } = useLanguage();
  const currency = 'OMR';

  const isLoading = bookingsLoading || customersLoading || agentsLoading || invoicesLoading;

  const totalRevenue = bookings.reduce((s, b) => s + b.sale_price, 0);
  const totalCost = bookings.reduce((s, b) => s + b.cost_price, 0);
  const netProfit = totalRevenue - totalCost;
  const pendingPayments = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.total, 0);
  const todaysBookings = bookings.filter((b) => {
    const today = new Date().toISOString().split('T')[0];
    return b.created_at.startsWith(today);
  }).length;
  const activeAgents = agents.filter((a) => a.active).length;

  const stats = [
    { label: 'Total Revenue', value: totalRevenue, change: '+0%', up: true, icon: DollarSign, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' },
    { label: 'Net Profit', value: netProfit, change: '+0%', up: true, icon: TrendingUp, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    { label: 'Pending Payments', value: pendingPayments, change: '-0%', up: false, icon: CreditCard, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
    { label: 'Total Bookings', value: bookings.length, change: '+0', up: true, icon: Briefcase, color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' },
    { label: "Today's Bookings", value: todaysBookings, change: '+0', up: true, icon: CalendarDays, color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' },
    { label: 'Active Agents', value: activeAgents, change: '0', up: true, icon: UserCheck, color: 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  const isEmpty = bookings.length === 0 && customers.length === 0 && invoices.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Command Center</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Welcome back, {user?.name || 'User'} · {formatDate(new Date(), language === 'ar' ? 'ar-SA' : 'en-US')}
          </p>
        </div>
      </div>

      {/* Empty State — First Visit */}
      {isEmpty && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">Welcome to TravelDesk Pro</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
            Your agency workspace is ready. Start by adding your first customer, creating a booking, or generating an invoice.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href='/customers' className='inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors shadow-sm'>
              <Plus className='w-4 h-4' /> Add Customer
            </Link>
            <Link href='/bookings' className='inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[#0F172A] dark:text-white rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors'>
              <Plus className='w-4 h-4' /> Create Booking
            </Link>
            <Link href='/invoices' className='inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[#0F172A] dark:text-white rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors'>
              <Plus className='w-4 h-4' /> Create Invoice
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4'>
        {stats.map((stat) => (
          <div key={stat.label} className='min-w-0 overflow-hidden bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5'>
            <div className='flex items-center justify-between gap-2 mb-3'>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon className='w-5 h-5' />
              </div>
              <div className={`min-w-0 flex items-center gap-1 text-xs font-semibold truncate ${stat.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {stat.up ? <ArrowUpRight className='w-3.5 h-3.5' /> : <ArrowDownRight className='w-3.5 h-3.5' />}
                {stat.change}
              </div>
            </div>
            <p className='truncate text-xl 2xl:text-2xl font-bold text-[#0F172A] dark:text-white' title={String(stat.value)}>
              {stat.label.includes('Bookings') || stat.label.includes('Agents') ? stat.value : formatCurrency(stat.value, currency)}
            </p>
            <p className='text-xs leading-snug text-slate-500 dark:text-slate-400 mt-1 break-words'>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts placeholder - only show when has data */}
      {bookings.length > 0 && (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm'>
            <h3 className='font-bold text-[#0F172A] dark:text-white'>Revenue Overview</h3>
            <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>Revenue data will appear here as you create bookings.</p>
          </div>
          <div className='bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm'>
            <h3 className='font-bold text-[#0F172A] dark:text-white'>Booking Types</h3>
            <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>Distribution across your booking categories.</p>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm'>
          <h3 className='font-bold text-[#0F172A] dark:text-white mb-4'>Recent Activity</h3>
          {bookings.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-sm text-slate-500 dark:text-slate-400'>No activity yet. Create your first booking to see it here.</p>
              <Link href='/bookings' className='inline-block mt-3 text-sm text-brand font-medium hover:underline'>Create Booking →</Link>
            </div>
          ) : (
            <div className='space-y-4'>
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className='flex flex-col sm:flex-row sm:items-start gap-3'>
                  <div className='w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0'>
                    <Plane className='w-4 h-4' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-[#0F172A] dark:text-white truncate'>{b.type} — {b.customer_name}</p>
                    <p className='text-sm text-slate-500 dark:text-slate-400 break-words'>{b.details}</p>
                  </div>
                  <span className='text-xs text-slate-400 dark:text-slate-500 shrink-0 sm:text-right'>{formatDate(b.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm'>
          <h3 className='font-bold text-[#0F172A] dark:text-white mb-4'>Quick Actions</h3>
          <div className='space-y-2'>
            <Link href='/bookings' className='flex items-center gap-3 w-full min-w-0 text-left px-4 py-3 rounded-xl bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-colors'>
              <Plus className='w-4 h-4 shrink-0' /> <span className='min-w-0 break-words'>New Booking</span>
            </Link>
            <Link href='/invoices' className='flex items-center gap-3 w-full min-w-0 text-left px-4 py-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors'>
              <FileText className='w-4 h-4 shrink-0' /> <span className='min-w-0 break-words'>Create Invoice</span>
            </Link>
            <Link href='/customers' className='flex items-center gap-3 w-full min-w-0 text-left px-4 py-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-500/20 transition-colors'>
              <Users className='w-4 h-4 shrink-0' /> <span className='min-w-0 break-words'>Add Customer</span>
            </Link>
            <Link href='/reports' className='flex items-center gap-3 w-full min-w-0 text-left px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-[#0F172A] dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors'>
              <TrendingUp className='w-4 h-4 shrink-0' /> <span className='min-w-0 break-words'>Generate Report</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
