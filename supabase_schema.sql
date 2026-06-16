-- ============================================================
-- TravelDesk Pro — Supabase Database Schema
-- Copy ALL of this into the Supabase SQL Editor and click RUN
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Agencies (one row per travel agency)
CREATE TABLE agencies (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cr_number TEXT,
  address TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'OMR',
  language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'trial' CHECK (status IN ('active', 'trial', 'suspended')),
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (linked to Supabase Auth, one row per staff member)
CREATE TABLE users (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  agency_id uuid REFERENCES agencies(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('super_admin', 'owner', 'admin', 'manager', 'agent', 'accountant', 'viewer')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers (each agency has its own customers)
CREATE TABLE customers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id uuid REFERENCES agencies(id) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT NOT NULL,
  passport_number TEXT,
  passport_expiry TEXT,
  nationality TEXT NOT NULL,
  total_bookings INTEGER DEFAULT 0,
  total_spend NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bookings
CREATE TABLE bookings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id uuid REFERENCES agencies(id) NOT NULL,
  customer_id uuid REFERENCES customers(id) NOT NULL,
  customer_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('air_ticket', 'visa', 'hotel', 'group_tour')),
  pnr TEXT,
  ticket_number TEXT,
  airline TEXT,
  route TEXT,
  visa_country TEXT,
  hotel_name TEXT,
  check_in TEXT,
  check_out TEXT,
  tour_name TEXT,
  details TEXT,
  agent_name TEXT,
  cost_price NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  agent_commission NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'OMR',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'refund')),
  process_status TEXT DEFAULT 'pending' CHECK (process_status IN ('pending', 'processing', 'approved', 'rejected', 'issued')),
  agent_id uuid,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Invoices
CREATE TABLE invoices (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id uuid REFERENCES agencies(id) NOT NULL,
  customer_id uuid REFERENCES customers(id) NOT NULL,
  customer_name TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'OMR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'refund', 'overdue')),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Agents
CREATE TABLE agents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id uuid REFERENCES agencies(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  commission_rate NUMERIC DEFAULT 0,
  total_sales NUMERIC DEFAULT 0,
  commission_earned NUMERIC DEFAULT 0,
  commission_paid NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Payments
CREATE TABLE payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id uuid REFERENCES agencies(id) NOT NULL,
  invoice_id uuid REFERENCES invoices(id) NOT NULL,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'OMR',
  method TEXT DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'bank_transfer', 'online')),
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) — THIS IS WHAT KEEPS AGENCIES SEPARATE
-- ============================================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_my_agency_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT agency_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT COALESCE(public.get_my_role() = 'super_admin', false);
$$;

GRANT EXECUTE ON FUNCTION public.get_my_agency_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Agencies: platform admins can list agencies; agency users see only theirs.
CREATE POLICY agencies_select ON agencies
  FOR SELECT USING (public.is_super_admin() OR id = public.get_my_agency_id());
CREATE POLICY agencies_update ON agencies
  FOR UPDATE USING (id = public.get_my_agency_id()) WITH CHECK (id = public.get_my_agency_id());
CREATE POLICY agencies_delete ON agencies
  FOR DELETE USING (id = public.get_my_agency_id());

-- Users: each user can read their own row; agency users can read their agency.
CREATE POLICY users_select ON users
  FOR SELECT USING (
    id = auth.uid()
    OR public.is_super_admin()
    OR (agency_id IS NOT NULL AND agency_id = public.get_my_agency_id())
  );
CREATE POLICY users_update ON users
  FOR UPDATE USING (
    id = auth.uid()
    OR (agency_id IS NOT NULL AND agency_id = public.get_my_agency_id())
  ) WITH CHECK (
    id = auth.uid()
    OR (agency_id IS NOT NULL AND agency_id = public.get_my_agency_id())
  );
CREATE POLICY users_delete ON users
  FOR DELETE USING (agency_id IS NOT NULL AND agency_id = public.get_my_agency_id());

-- Agency data: only users with the matching agency_id can access rows.
CREATE POLICY customers_isolation ON customers
  FOR ALL USING (agency_id = public.get_my_agency_id()) WITH CHECK (agency_id = public.get_my_agency_id());
CREATE POLICY bookings_isolation ON bookings
  FOR ALL USING (agency_id = public.get_my_agency_id()) WITH CHECK (agency_id = public.get_my_agency_id());
CREATE POLICY invoices_isolation ON invoices
  FOR ALL USING (agency_id = public.get_my_agency_id()) WITH CHECK (agency_id = public.get_my_agency_id());
CREATE POLICY agents_isolation ON agents
  FOR ALL USING (agency_id = public.get_my_agency_id()) WITH CHECK (agency_id = public.get_my_agency_id());
CREATE POLICY payments_isolation ON payments
  FOR ALL USING (agency_id = public.get_my_agency_id()) WITH CHECK (agency_id = public.get_my_agency_id());
