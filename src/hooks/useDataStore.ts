'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useDataMode, DEMO_BOOKING_LIMIT } from '@/context/DataModeContext';

// ============================================================
// DATA STORE — Hybrid: Supabase (cloud) + localStorage (fallback)
// When NEXT_PUBLIC_SUPABASE_URL is set → uses real database
// When not set → uses browser localStorage (demo/dev mode)
//
// useDataMode() adds a third switch: when DataModeProvider wraps a route
// tree (i.e. /demo/*), all hooks use localStorage regardless of whether
// Supabase is configured. This is how demo isolation works without any
// demo-specific code in the page components.
// ============================================================

function getStorageKey(agencyId: string, table: string) {
  return `tdp_${table}_${agencyId}`;
}

function loadTable<T>(agencyId: string, table: string): T[] {
  if (typeof window === 'undefined') return [];
  const key = getStorageKey(agencyId, table);
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveTable<T>(agencyId: string, table: string, data: T[]) {
  if (typeof window === 'undefined') return;
  const key = getStorageKey(agencyId, table);
  localStorage.setItem(key, JSON.stringify(data));
}

function loadSettings<T>(agencyId: string, key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`tdp_settings_${agencyId}_${key}`);
  return raw ? JSON.parse(raw) : null;
}

function saveSettings<T>(agencyId: string, key: string, data: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`tdp_settings_${agencyId}_${key}`, JSON.stringify(data));
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const isSupabaseEnabled = !!supabase;

// ========== INVOICE SETTINGS ==========
export interface InvoiceSettings {
  prefix: string;
  nextSequence: number;
  taxEnabled: boolean;
  taxPercentage: number;
  defaultCurrency: string;
  defaultNotes: string;
  terms: string;
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  prefix: 'INV',
  nextSequence: 1,
  taxEnabled: true,
  taxPercentage: 5,
  defaultCurrency: 'OMR',
  defaultNotes: 'Thank you for choosing our services.',
  terms: 'Payment is due within 30 days of invoice date.',
};

export function useInvoiceSettings() {
  const { user } = useAuth();
  const agencyId = user?.agencyId || 'demo';
  const [settings, setSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);

  useEffect(() => {
    const stored = loadSettings<InvoiceSettings>(agencyId, 'invoice');
    if (stored) setSettings(stored);
  }, [agencyId]);

  const update = useCallback((partial: Partial<InvoiceSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      saveSettings(agencyId, 'invoice', updated);
      return updated;
    });
  }, [agencyId]);

  const generateNumber = useCallback(() => {
    const next = settings.nextSequence;
    const padded = String(next).padStart(4, '0');
    const number = `${settings.prefix}-${padded}`;
    update({ nextSequence: next + 1 });
    return number;
  }, [settings, update]);

  return { settings, update, generateNumber };
}

// ========== WHATSAPP SETTINGS ==========
export interface WhatsAppSettings {
  provider: string;
  apiKey: string;
  instanceId: string;
  enabled: boolean;
}

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = {
  provider: 'wame',
  apiKey: '',
  instanceId: '',
  enabled: false,
};

export function useWhatsAppSettings() {
  const { user } = useAuth();
  const agencyId = user?.agencyId || 'demo';
  const [settings, setSettings] = useState<WhatsAppSettings>(DEFAULT_WHATSAPP_SETTINGS);

  useEffect(() => {
    const stored = loadSettings<WhatsAppSettings>(agencyId, 'whatsapp');
    if (stored) setSettings(stored);
  }, [agencyId]);

  const update = useCallback((partial: Partial<WhatsAppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      saveSettings(agencyId, 'whatsapp', updated);
      return updated;
    });
  }, [agencyId]);

  return { settings, update };
}

// ========== AGENCY BRANDING ==========
export interface AgencyBranding {
  logoUrl?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  crNumber: string;
  vatNumber: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
}

export function useAgencyBranding(): { branding: AgencyBranding; update: (partial: Partial<AgencyBranding>) => void } {
  const { agency } = useAuth();
  const agencyId = agency?.id || 'demo';
  const [branding, setBranding] = useState<AgencyBranding>({
    name: agency?.name || 'TravelDesk Pro',
    address: agency?.address || 'Muscat, Oman',
    phone: agency?.phone || '',
    email: agency?.email || '',
    website: '',
    crNumber: '',
    vatNumber: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    swiftCode: '',
  });

  useEffect(() => {
    const stored = loadSettings<AgencyBranding>(agencyId, 'branding');
    if (stored) {
      setBranding(stored);
    } else if (agency) {
      setBranding({
        name: agency.name || '',
        address: agency.address || '',
        phone: agency.phone || '',
        email: agency.email || '',
        website: '',
        crNumber: '',
        vatNumber: '',
        bankName: '',
        accountName: '',
        accountNumber: '',
        iban: '',
        swiftCode: '',
      });
    }
  }, [agencyId, agency]);

  const update = useCallback((partial: Partial<AgencyBranding>) => {
    setBranding((prev) => {
      const updated = { ...prev, ...partial };
      saveSettings(agencyId, 'branding', updated);
      return updated;
    });
  }, [agencyId]);

  return { branding, update };
}

// ========== CUSTOMERS ==========
export interface CustomerRecord {
  id: string;
  agency_id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email: string;
  passport_number?: string;
  passport_expiry?: string;
  nationality: string;
  total_bookings: number;
  total_spend: number;
  notes?: string;
  created_at: string;
}

export function useCustomers() {
  const { user } = useAuth();
  const { useLocalStorage } = useDataMode();
  const agencyId = user?.agencyId || 'demo';
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      supabase
        .from('customers')
        .select('*')
        .eq('agency_id', agencyId)
        .then(({ data, error }) => {
          if (cancelled) return;
          if (!error && data) setCustomers(data as CustomerRecord[]);
          setLoading(false);
        });
    } else {
      setCustomers(loadTable<CustomerRecord>(agencyId, 'customers'));
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [agencyId, useLocalStorage]);

  const create = useCallback(async (data: Omit<CustomerRecord, 'id' | 'agency_id' | 'created_at' | 'total_bookings' | 'total_spend'>) => {
    const newRecord: CustomerRecord = {
      id: crypto?.randomUUID ? crypto.randomUUID() : generateId(),
      agency_id: agencyId,
      ...data,
      total_bookings: 0,
      total_spend: 0,
      created_at: new Date().toISOString(),
    };
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      const { data: inserted, error } = await supabase.from('customers').insert(newRecord).select().single();
      if (!error && inserted) {
        setCustomers((prev) => [inserted as CustomerRecord, ...prev]);
        return inserted as CustomerRecord;
      }
    }
    setCustomers((prev) => {
      const updated = [newRecord, ...prev];
      saveTable(agencyId, 'customers', updated);
      return updated;
    });
    return newRecord;
  }, [agencyId, useLocalStorage]);

  const update = useCallback(async (id: string, data: Partial<Omit<CustomerRecord, 'id' | 'agency_id'>>) => {
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      await supabase.from('customers').update(data).eq('id', id);
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    } else {
      setCustomers((prev) => {
        const updated = prev.map((c) => (c.id === id ? { ...c, ...data } : c));
        saveTable(agencyId, 'customers', updated);
        return updated;
      });
    }
  }, [agencyId, useLocalStorage]);

  const remove = useCallback(async (id: string) => {
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      await supabase.from('customers').delete().eq('id', id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } else {
      setCustomers((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        saveTable(agencyId, 'customers', updated);
        return updated;
      });
    }
  }, [agencyId, useLocalStorage]);

  const search = useCallback((query: string) => {
    const q = query.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.passport_number?.toLowerCase().includes(q)
    );
  }, [customers]);

  return { customers, loading, create, update, remove, search };
}

// ========== BOOKINGS ==========
export interface BookingRecord {
  id: string;
  agency_id: string;
  customer_id: string;
  customer_name: string;
  type: 'air_ticket' | 'visa' | 'hotel' | 'group_tour';
  details: string;
  cost_price: number;
  sale_price: number;
  agent_commission: number;
  currency: string;
  payment_status: 'paid' | 'pending' | 'refund';
  process_status: 'pending' | 'processing' | 'approved' | 'rejected' | 'issued';
  agent_id?: string;
  agent_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  pnr?: string | null;
  ticket_number?: string | null;
  airline?: string | null;
  route?: string | null;
  visa_country?: string | null;
  hotel_name?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  tour_name?: string | null;
}

export function useBookings() {
  const { user } = useAuth();
  const { useLocalStorage } = useDataMode();
  const agencyId = user?.agencyId || 'demo';
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      supabase
        .from('bookings')
        .select('*')
        .eq('agency_id', agencyId)
        .then(({ data, error }) => {
          if (cancelled) return;
          if (!error && data) setBookings(data as BookingRecord[]);
          setLoading(false);
        });
    } else {
      setBookings(loadTable<BookingRecord>(agencyId, 'bookings'));
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [agencyId, useLocalStorage]);

  const create = useCallback(async (data: Omit<BookingRecord, 'id' | 'agency_id' | 'created_at' | 'updated_at'>) => {
    // Enforce the demo booking limit when running in localStorage mode.
    // Reading from storage (not React state) ensures the check is always
    // up-to-date regardless of which hook instance is calling.
    if (useLocalStorage) {
      const existing = loadTable<BookingRecord>(agencyId, 'bookings');
      if (existing.length >= DEMO_BOOKING_LIMIT) {
        throw new Error(
          `Demo limit reached (${DEMO_BOOKING_LIMIT} bookings). ` +
          `Create a free account for unlimited bookings.`
        );
      }
    }

    const now = new Date().toISOString();
    const newRecord: BookingRecord = {
      id: crypto?.randomUUID ? crypto.randomUUID() : generateId(),
      agency_id: agencyId,
      ...data,
      created_at: now,
      updated_at: now,
    };
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      const { data: inserted, error } = await supabase
        .from('bookings')
        .insert(newRecord)
        .select()
        .single();

      // In production mode, never silently fall back to localStorage.
      // Throw so the page-level try/catch surfaces the message to the user.
      if (error) throw new Error(error.message);
      if (!inserted) throw new Error('Insert returned no data — check Supabase logs.');
      setBookings((prev) => [inserted as BookingRecord, ...prev]);
      return inserted as BookingRecord;
    }

    // localStorage path — only reached in demo mode (useLocalStorage = true)
    // or when Supabase is not configured (local dev without .env).

    setBookings((prev) => {
      const updated = [newRecord, ...prev];
      saveTable(agencyId, 'bookings', updated);
      return updated;
    });
    // Notify the DemoShell sidebar counter so it refreshes in real time.
    if (useLocalStorage && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tdp-demo-data-change'));
    }
    return newRecord;
  }, [agencyId, useLocalStorage]);

  const update = useCallback(async (id: string, data: Partial<Omit<BookingRecord, 'id' | 'agency_id'>>) => {
    const updateData = { ...data, updated_at: new Date().toISOString() };
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      await supabase.from('bookings').update(updateData).eq('id', id);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...updateData } : b)));
    } else {
      setBookings((prev) => {
        const updated = prev.map((b) => (b.id === id ? { ...b, ...updateData } : b));
        saveTable(agencyId, 'bookings', updated);
        return updated;
      });
    }
  }, [agencyId, useLocalStorage]);

  const remove = useCallback(async (id: string) => {
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      await supabase.from('bookings').delete().eq('id', id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } else {
      setBookings((prev) => {
        const updated = prev.filter((b) => b.id !== id);
        saveTable(agencyId, 'bookings', updated);
        return updated;
      });
      // Notify DemoShell counter on deletion too.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tdp-demo-data-change'));
      }
    }
  }, [agencyId, useLocalStorage]);

  const search = useCallback((query: string, filter?: string) => {
    const q = query.toLowerCase();
    return bookings.filter((b) => {
      const matchesQuery =
        b.customer_name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.details.toLowerCase().includes(q);
      const matchesFilter = !filter || filter === 'all' || b.type === filter;
      return matchesQuery && matchesFilter;
    });
  }, [bookings]);

  return { bookings, loading, create, update, remove, search };
}

// ========== INVOICES ==========
export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface InvoiceRecord {
  id: string;
  agency_id: string;
  customer_id: string;
  customer_name: string;
  customer_passport?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_nationality?: string;
  invoice_number: string;
  prefix: string;
  sequence: number;
  items: InvoiceItem[];
  subtotal: number;
  tax_enabled: boolean;
  tax_percentage: number;
  tax: number;
  total: number;
  currency: string;
  status: 'paid' | 'pending' | 'refund' | 'overdue';
  issued_at: string;
  due_date: string;
  paid_at?: string;
  notes?: string;
  agency_branding?: {
    logo_url?: string;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    cr_number?: string;
    vat_number?: string;
    bank_name?: string;
    account_name?: string;
    account_number?: string;
    iban?: string;
    swift_code?: string;
  };
  created_at: string;
}

export function useInvoices() {
  const { user } = useAuth();
  const { useLocalStorage } = useDataMode();
  const agencyId = user?.agencyId || 'demo';
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      supabase
        .from('invoices')
        .select('*')
        .eq('agency_id', agencyId)
        .then(({ data, error }) => {
          if (cancelled) return;
          if (!error && data) {
            const parsed = (data as any[]).map((d) => ({ ...d, items: Array.isArray(d.items) ? d.items : JSON.parse(d.items || '[]') }));
            setInvoices(parsed as InvoiceRecord[]);
          }
          setLoading(false);
        });
    } else {
      setInvoices(loadTable<InvoiceRecord>(agencyId, 'invoices'));
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [agencyId, useLocalStorage]);

  const create = useCallback(async (data: Omit<InvoiceRecord, 'id' | 'agency_id' | 'created_at'>) => {
    const newRecord: InvoiceRecord = {
      id: crypto?.randomUUID ? crypto.randomUUID() : generateId(),
      agency_id: agencyId,
      ...data,
      created_at: new Date().toISOString(),
    };
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID_RE.test(newRecord.agency_id)) {
        throw new Error(`agency_id is not a valid UUID: "${newRecord.agency_id}". Ensure you are logged in with a valid agency account.`);
      }
      if (!UUID_RE.test(newRecord.customer_id)) {
        throw new Error(`customer_id is not a valid UUID: "${newRecord.customer_id}". Please select a customer from the dropdown.`);
      }
      const insertPayload = {
        id: newRecord.id,
        agency_id: newRecord.agency_id,
        customer_id: newRecord.customer_id,
        customer_name: newRecord.customer_name,
        invoice_number: newRecord.invoice_number,
        items: newRecord.items,
        subtotal: newRecord.subtotal,
        tax: newRecord.tax,
        total: newRecord.total,
        currency: newRecord.currency,
        status: newRecord.status,
        issued_at: newRecord.issued_at,
        due_date: newRecord.due_date,
        paid_at: newRecord.paid_at ?? null,
        created_at: newRecord.created_at,
      };
      const { data: inserted, error } = await supabase.from('invoices').insert(insertPayload).select().single();
      if (error) {
        console.error('[useInvoices] Supabase insert error:', error.message, error.details, error.hint, error.code);
        throw error;
      }
      const parsed = { ...newRecord, ...inserted, items: Array.isArray(inserted.items) ? inserted.items : JSON.parse(inserted.items || '[]') };
      setInvoices((prev) => [parsed as InvoiceRecord, ...prev]);
      return parsed as InvoiceRecord;
    }
    setInvoices((prev) => {
      const updated = [newRecord, ...prev];
      saveTable(agencyId, 'invoices', updated);
      return updated;
    });
    return newRecord;
  }, [agencyId, useLocalStorage]);

  const update = useCallback(async (id: string, data: Partial<Omit<InvoiceRecord, 'id' | 'agency_id'>>) => {
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      await supabase.from('invoices').update(data).eq('id', id);
      setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
    } else {
      setInvoices((prev) => {
        const updated = prev.map((i) => (i.id === id ? { ...i, ...data } : i));
        saveTable(agencyId, 'invoices', updated);
        return updated;
      });
    }
  }, [agencyId, useLocalStorage]);

  const updateStatus = useCallback(async (id: string, status: InvoiceRecord['status']) => {
    const updateData = { status, paid_at: status === 'paid' ? new Date().toISOString() : undefined };
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      await supabase.from('invoices').update(updateData).eq('id', id);
      setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...updateData } : i)));
    } else {
      setInvoices((prev) => {
        const updated = prev.map((i) => (i.id === id ? { ...i, ...updateData } : i));
        saveTable(agencyId, 'invoices', updated);
        return updated;
      });
    }
  }, [agencyId, useLocalStorage]);

  const remove = useCallback(async (id: string) => {
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      await supabase.from('invoices').delete().eq('id', id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
    } else {
      setInvoices((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        saveTable(agencyId, 'invoices', updated);
        return updated;
      });
    }
  }, [agencyId, useLocalStorage]);

  return { invoices, loading, create, update, updateStatus, remove };
}

// ========== AGENTS ==========
export interface AgentRecord {
  id: string;
  agency_id: string;
  name: string;
  email: string;
  phone: string;
  commission_rate: number;
  total_sales: number;
  commission_earned: number;
  commission_paid: number;
  active: boolean;
  created_at: string;
}

export function useAgents() {
  const { user } = useAuth();
  const { useLocalStorage } = useDataMode();
  const agencyId = user?.agencyId || 'demo';
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      supabase
        .from('agents')
        .select('*')
        .eq('agency_id', agencyId)
        .then(({ data, error }) => {
          if (cancelled) return;
          if (!error && data) setAgents(data as AgentRecord[]);
          setLoading(false);
        });
    } else {
      setAgents(loadTable<AgentRecord>(agencyId, 'agents'));
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [agencyId, useLocalStorage]);

  const create = useCallback(async (data: Omit<AgentRecord, 'id' | 'agency_id' | 'created_at' | 'total_sales' | 'commission_earned' | 'commission_paid'>) => {
    const newRecord: AgentRecord = {
      id: crypto?.randomUUID ? crypto.randomUUID() : generateId(),
      agency_id: agencyId,
      ...data,
      total_sales: 0,
      commission_earned: 0,
      commission_paid: 0,
      created_at: new Date().toISOString(),
    };
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      const { data: inserted, error } = await supabase.from('agents').insert(newRecord).select().single();
      if (!error && inserted) {
        setAgents((prev) => [inserted as AgentRecord, ...prev]);
        return inserted as AgentRecord;
      }
    }
    setAgents((prev) => {
      const updated = [newRecord, ...prev];
      saveTable(agencyId, 'agents', updated);
      return updated;
    });
    return newRecord;
  }, [agencyId, useLocalStorage]);

  const update = useCallback(async (id: string, data: Partial<Omit<AgentRecord, 'id' | 'agency_id'>>) => {
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      await supabase.from('agents').update(data).eq('id', id);
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
    } else {
      setAgents((prev) => {
        const updated = prev.map((a) => (a.id === id ? { ...a, ...data } : a));
        saveTable(agencyId, 'agents', updated);
        return updated;
      });
    }
  }, [agencyId, useLocalStorage]);

  const remove = useCallback(async (id: string) => {
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      await supabase.from('agents').delete().eq('id', id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
    } else {
      setAgents((prev) => {
        const updated = prev.filter((a) => a.id !== id);
        saveTable(agencyId, 'agents', updated);
        return updated;
      });
    }
  }, [agencyId, useLocalStorage]);

  const recalculateCommissions = useCallback((bookings: BookingRecord[]) => {
    setAgents((prevAgents) => {
      const updated = prevAgents.map((agent) => {
        const agentBookings = bookings.filter((b) => b.agent_id === agent.id && b.payment_status === 'paid');
        const totalSales = agentBookings.reduce((s, b) => s + b.sale_price, 0);
        const earned = agentBookings.reduce((s, b) => s + (b.sale_price * b.agent_commission) / 100, 0);
        return { ...agent, total_sales: totalSales, commission_earned: earned };
      });
      saveTable(agencyId, 'agents', updated);
      return updated;
    });
  }, [agencyId]);

  return { agents, loading, create, update, remove, recalculateCommissions };
}

// ========== PAYMENTS ==========
export interface PaymentRecord {
  id: string;
  agency_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  method: 'cash' | 'card' | 'bank_transfer' | 'online';
  reference?: string | null;
  notes?: string | null;
  created_at: string;
  // denormalized for display (not in DB)
  invoice_number?: string;
  customer_name?: string;
}

export function usePayments() {
  const { user } = useAuth();
  const { useLocalStorage } = useDataMode();
  const agencyId = user?.agencyId || 'demo';
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      supabase
        .from('payments')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (!error && data) setPayments(data as PaymentRecord[]);
          setLoading(false);
        });
    } else {
      setPayments(loadTable<PaymentRecord>(agencyId, 'payments'));
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [agencyId, useLocalStorage]);

  const create = useCallback(async (data: Omit<PaymentRecord, 'id' | 'agency_id' | 'created_at'>) => {
    const newRecord: PaymentRecord = {
      id: crypto?.randomUUID ? crypto.randomUUID() : generateId(),
      agency_id: agencyId,
      ...data,
      created_at: new Date().toISOString(),
    };
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      const insertPayload = {
        id: newRecord.id,
        agency_id: newRecord.agency_id,
        invoice_id: newRecord.invoice_id,
        amount: newRecord.amount,
        currency: newRecord.currency || 'OMR',
        method: newRecord.method,
        reference: newRecord.reference ?? null,
        notes: newRecord.notes ?? null,
        created_at: newRecord.created_at,
      };
      const { data: inserted, error } = await supabase.from('payments').insert(insertPayload).select().single();
      if (error) {
        console.error('[usePayments] Supabase insert error:', error.message, error.details, error.hint, error.code);
        throw error;
      }
      const parsed = { ...newRecord, ...inserted } as PaymentRecord;
      setPayments((prev) => [parsed, ...prev]);
      return parsed;
    }
    setPayments((prev) => {
      const updated = [newRecord, ...prev];
      saveTable(agencyId, 'payments', updated);
      return updated;
    });
    return newRecord;
  }, [agencyId, useLocalStorage]);

  const remove = useCallback(async (id: string) => {
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      await supabase.from('payments').delete().eq('id', id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } else {
      setPayments((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        saveTable(agencyId, 'payments', updated);
        return updated;
      });
    }
  }, [agencyId, useLocalStorage]);

  return { payments, loading, create, remove };
}

// ========== ROLE-BASED ACCESS ==========
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || 'viewer';

  const can = useCallback((action: 'create' | 'edit' | 'delete' | 'view' | 'manage' | 'admin' | 'reports') => {
    const perms: Record<string, string[]> = {
      owner: ['create', 'edit', 'delete', 'view', 'manage', 'admin', 'reports'],
      admin: ['create', 'edit', 'delete', 'view', 'manage', 'admin', 'reports'],
      manager: ['create', 'edit', 'view', 'reports'],
      agent: ['create', 'edit', 'view'],
      accountant: ['view', 'reports'],
      viewer: ['view'],
    };
    return perms[role]?.includes(action) ?? false;
  }, [role]);

  return { role, can };
}
