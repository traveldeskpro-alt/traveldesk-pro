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

function normalizeTimestamp(value: string | undefined, fieldName: string) {
  if (!value) {
    throw new Error(`${fieldName} is required.`);
  }
  const parsed = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return parsed.toISOString();
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
    logoUrl: agency?.logoUrl || '',
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
        logoUrl: agency.logoUrl || '',
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

// ========== CALENDAR EVENTS ==========
export interface CalendarEventRecord {
  id: string;
  agency_id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  type: 'meeting' | 'deadline' | 'reminder' | 'travel' | 'booking';
  customer_name?: string | null;
  created_at: string;
  updated_at: string;
}

export function useCalendarEvents() {
  const { user } = useAuth();
  const { useLocalStorage } = useDataMode();
  const agencyId = user?.agencyId || (useLocalStorage ? 'demo' : '');
  const [events, setEvents] = useState<CalendarEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!agencyId) {
      setEvents([]);
      setLoading(false);
      return () => { cancelled = true; };
    }
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      supabase
        .from('calendar_events')
        .select('*')
        .eq('agency_id', agencyId)
        .order('start_at', { ascending: true })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (!error && data) setEvents(data as CalendarEventRecord[]);
          setLoading(false);
        });
    } else {
      setEvents(loadTable<CalendarEventRecord>(agencyId, 'calendar_events'));
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [agencyId, useLocalStorage]);

  const create = useCallback(async (data: Omit<CalendarEventRecord, 'id' | 'agency_id' | 'created_at' | 'updated_at'>) => {
    if (!agencyId) throw new Error('An agency account is required to create calendar events.');
    const now = new Date().toISOString();
    const newRecord: CalendarEventRecord = {
      id: crypto?.randomUUID ? crypto.randomUUID() : generateId(),
      agency_id: agencyId,
      ...data,
      created_at: now,
      updated_at: now,
    };
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      const { data: inserted, error } = await supabase.from('calendar_events').insert(newRecord).select().single();
      if (error) throw new Error(error.message);
      if (!inserted) throw new Error('Calendar event insert returned no data.');
      setEvents((prev) => [...prev, inserted as CalendarEventRecord].sort((a, b) => a.start_at.localeCompare(b.start_at)));
      return inserted as CalendarEventRecord;
    }
    setEvents((prev) => {
      const updated = [...prev, newRecord].sort((a, b) => a.start_at.localeCompare(b.start_at));
      saveTable(agencyId, 'calendar_events', updated);
      return updated;
    });
    return newRecord;
  }, [agencyId, useLocalStorage]);

  const update = useCallback(async (id: string, data: Partial<Omit<CalendarEventRecord, 'id' | 'agency_id' | 'created_at'>>) => {
    const updateData = { ...data, updated_at: new Date().toISOString() };
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('calendar_events').update(updateData).eq('id', id);
      if (error) throw new Error(error.message);
    }
    setEvents((prev) => {
      const updated = prev
        .map((event) => (event.id === id ? { ...event, ...updateData } : event))
        .sort((a, b) => a.start_at.localeCompare(b.start_at));
      if (useLocalStorage || !isSupabaseEnabled) saveTable(agencyId, 'calendar_events', updated);
      return updated;
    });
  }, [agencyId, useLocalStorage]);

  const remove = useCallback(async (id: string) => {
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
    setEvents((prev) => {
      const updated = prev.filter((event) => event.id !== id);
      if (useLocalStorage || !isSupabaseEnabled) saveTable(agencyId, 'calendar_events', updated);
      return updated;
    });
  }, [agencyId, useLocalStorage]);

  return { events, loading, create, update, remove };
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
  const agencyId = user?.agencyId || (useLocalStorage ? 'demo' : '');
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!agencyId) {
      setCustomers([]);
      setLoading(false);
      return () => { cancelled = true; };
    }
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
    if (!agencyId) throw new Error('An agency account is required to create customers.');
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
  // Ownership
  created_by_name?: string | null;
  issued_by_name?: string | null;
  // Per-booking commission
  commission_amount?: number;
  commission_paid?: boolean;
  commission_paid_at?: string | null;
  commission_notes?: string | null;
}

export function useBookings() {
  const { user } = useAuth();
  const { useLocalStorage } = useDataMode();
  const agencyId = user?.agencyId || (useLocalStorage ? 'demo' : '');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!agencyId) {
      setBookings([]);
      setLoading(false);
      return () => { cancelled = true; };
    }
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
    if (!agencyId) throw new Error('An agency account is required to create bookings.');
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

  // Mark all unpaid commissions for a given agent as paid.
  const markAgentCommissionPaid = useCallback(async (
    agentId: string,
    paidAt: string,
    notes: string,
  ) => {
    const targets = bookings.filter(
      (b) => b.agent_id === agentId && !b.commission_paid && (b.commission_amount ?? 0) > 0,
    );
    if (targets.length === 0) return;
    const updateData = {
      commission_paid: true,
      commission_paid_at: paidAt,
      commission_notes: notes || null,
      updated_at: new Date().toISOString(),
    };
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      const ids = targets.map((b) => b.id);
      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .in('id', ids);
      if (error) throw new Error(error.message);
    }
    setBookings((prev) => {
      const updated = prev.map((b) =>
        targets.some((t) => t.id === b.id) ? { ...b, ...updateData } : b,
      );
      if (useLocalStorage || !isSupabaseEnabled) saveTable(agencyId, 'bookings', updated);
      return updated;
    });
  }, [agencyId, bookings, useLocalStorage]);

  return { bookings, loading, create, update, remove, search, markAgentCommissionPaid };
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
  const agencyId = user?.agencyId || (useLocalStorage ? 'demo' : '');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!agencyId) {
      setInvoices([]);
      setLoading(false);
      return () => { cancelled = true; };
    }
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
    if (!agencyId) throw new Error('An agency account is required to create invoices.');
    const issuedAt = normalizeTimestamp(data.issued_at, 'Issue date');
    const dueDate = normalizeTimestamp(data.due_date, 'Due date');
    if (new Date(dueDate) < new Date(issuedAt)) {
      throw new Error('Due date cannot be before the issue date.');
    }

    const newRecord: InvoiceRecord = {
      id: crypto?.randomUUID ? crypto.randomUUID() : generateId(),
      agency_id: agencyId,
      ...data,
      issued_at: issuedAt,
      due_date: dueDate,
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
        customer_passport: newRecord.customer_passport ?? null,
        customer_phone: newRecord.customer_phone ?? null,
        customer_email: newRecord.customer_email ?? null,
        customer_nationality: newRecord.customer_nationality ?? null,
        invoice_number: newRecord.invoice_number,
        prefix: newRecord.prefix,
        sequence: newRecord.sequence,
        items: newRecord.items,
        subtotal: newRecord.subtotal,
        tax_enabled: newRecord.tax_enabled,
        tax_percentage: newRecord.tax_percentage,
        tax: newRecord.tax,
        total: newRecord.total,
        currency: newRecord.currency,
        status: newRecord.status,
        issued_at: newRecord.issued_at,
        due_date: newRecord.due_date,
        paid_at: newRecord.paid_at ?? null,
        notes: newRecord.notes ?? null,
        agency_branding: newRecord.agency_branding ?? null,
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
  commission_type: 'percentage' | 'fixed';
  commission_base: 'profit' | 'total_sale' | 'service_fee';
  commission_rate: number;
  total_sales: number;
  commission_earned: number;
  commission_paid: number;
  active: boolean;
  created_at: string;
}

// Calculate the commission amount for a single booking given the agent's settings.
export function calculateCommission(
  agent: Pick<AgentRecord, 'commission_type' | 'commission_base' | 'commission_rate'>,
  salePrice: number,
  costPrice: number,
): number {
  if (agent.commission_type === 'fixed') {
    return agent.commission_rate;
  }
  const base =
    agent.commission_base === 'profit'
      ? Math.max(0, salePrice - costPrice)
      : salePrice;
  return (base * agent.commission_rate) / 100;
}

export function useAgents() {
  const { user } = useAuth();
  const { useLocalStorage } = useDataMode();
  const agencyId = user?.agencyId || (useLocalStorage ? 'demo' : '');
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!agencyId) {
      setAgents([]);
      setLoading(false);
      return () => { cancelled = true; };
    }
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
    if (!agencyId) throw new Error('An agency account is required to create agents.');
    const newRecord: AgentRecord = {
      ...data,
      id: crypto?.randomUUID ? crypto.randomUUID() : generateId(),
      agency_id: agencyId,
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

// ========== STAFF (agency users) ==========
export interface StaffRecord {
  id: string;
  agency_id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  active: boolean;
  created_at: string;
}

export function useStaff() {
  const { user } = useAuth();
  const { useLocalStorage } = useDataMode();
  const agencyId = user?.agencyId || (useLocalStorage ? 'demo' : '');
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!agencyId) {
      setStaff([]);
      setLoading(false);
      return () => { cancelled = true; };
    }
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      supabase
        .from('users')
        .select('id,agency_id,email,name,phone,role,active,created_at')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: true })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (!error && data) setStaff(data as StaffRecord[]);
          setLoading(false);
        });
    } else {
      const key = `tdp_staff_${agencyId}`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      const stored: StaffRecord[] = raw ? JSON.parse(raw) : [];
      if (stored.length === 0 && user) {
        const seed: StaffRecord = {
          id: user.id,
          agency_id: agencyId,
          email: user.email,
          name: user.name,
          phone: '',
          role: user.role,
          active: true,
          created_at: new Date().toISOString(),
        };
        setStaff([seed]);
      } else {
        setStaff(stored);
      }
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [agencyId, useLocalStorage, user]);

  const create = useCallback(async (data: Omit<StaffRecord, 'id' | 'agency_id' | 'created_at'>) => {
    if (!agencyId) throw new Error('An agency account is required to add staff.');
    const newRecord: StaffRecord = {
      id: crypto?.randomUUID ? crypto.randomUUID() : generateId(),
      agency_id: agencyId,
      ...data,
      created_at: new Date().toISOString(),
    };
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      const { data: inserted, error } = await supabase
        .from('users')
        .insert({
          id: newRecord.id,
          agency_id: agencyId,
          email: newRecord.email,
          name: newRecord.name,
          phone: newRecord.phone ?? null,
          role: newRecord.role,
          active: newRecord.active,
        })
        .select('id,agency_id,email,name,phone,role,active,created_at')
        .single();
      if (error) throw new Error(error.message);
      setStaff((prev) => [...prev, inserted as StaffRecord]);
      return inserted as StaffRecord;
    }
    setStaff((prev) => {
      const updated = [...prev, newRecord];
      if (typeof window !== 'undefined') localStorage.setItem(`tdp_staff_${agencyId}`, JSON.stringify(updated));
      return updated;
    });
    return newRecord;
  }, [agencyId, useLocalStorage]);

  const update = useCallback(async (id: string, data: Partial<Omit<StaffRecord, 'id' | 'agency_id' | 'created_at'>>) => {
    if (!useLocalStorage && isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('users').update(data).eq('id', id);
      if (error) throw new Error(error.message);
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    } else {
      setStaff((prev) => {
        const updated = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
        if (typeof window !== 'undefined') localStorage.setItem(`tdp_staff_${agencyId}`, JSON.stringify(updated));
        return updated;
      });
    }
  }, [agencyId, useLocalStorage]);

  return { staff, loading, create, update };
}

// ========== ROLE-BASED ACCESS ==========
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || 'viewer';

  const can = useCallback((action: 'create' | 'edit' | 'delete' | 'view' | 'manage' | 'admin' | 'reports') => {
    const perms: Record<string, string[]> = {
      super_admin: ['view', 'admin', 'reports'],
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

// ========== INVOICE NUMBER GENERATION ==========
// In production (Supabase) mode, calls the server-side RPC
// get_next_invoice_number() for an atomic, collision-free sequence.
// Falls back to the provided localStorage generator in demo/offline mode.
export async function generateInvoiceNumber(
  agencyId: string,
  prefix: string,
  useLocalStorageMode: boolean,
  localGenerateFn: () => string,
): Promise<string> {
  if (!useLocalStorageMode && isSupabaseEnabled && supabase) {
    const { data, error } = await supabase.rpc('get_next_invoice_number', {
      p_agency_id: agencyId,
      p_prefix: prefix,
    });
    if (!error && typeof data === 'string' && data.length > 0) {
      return data;
    }
    // If the RPC fails (e.g. migration not yet applied), fall through to localStorage.
  }
  return localGenerateFn();
}
