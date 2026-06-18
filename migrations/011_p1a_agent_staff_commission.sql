-- ============================================================
-- Migration 011 — P1A: Agent, Staff & Commission Management
--
-- 1. Add phone column to users (staff profiles)
-- 2. Expand role CHECK to include ticketing_staff, sales_staff
-- 3. Add commission_type and commission_base to agents
-- 4. Add booking ownership fields (created_by_name, issued_by_name)
-- 5. Add per-booking commission tracking fields
-- ============================================================

-- ============================================================
-- 1. Staff: phone column
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ============================================================
-- 2. Expand roles
--
--    Drop the existing CHECK constraint and replace it so the new
--    roles ticketing_staff and sales_staff are accepted.
--    All existing role values remain valid.
-- ============================================================

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (
    role IN (
      'super_admin',
      'owner',
      'admin',
      'manager',
      'agent',
      'ticketing_staff',
      'sales_staff',
      'accountant',
      'viewer'
    )
  );

-- ============================================================
-- 3. Agents: commission type and base
--
--    commission_type: 'percentage' | 'fixed'
--    commission_base: how percentage commission is calculated
--      'profit'      → (sale_price - cost_price) × rate / 100
--      'total_sale'  → sale_price × rate / 100
--      'service_fee' → sale_price × rate / 100  (alias, reserved for
--                      future when service_fee is tracked separately)
-- ============================================================

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS commission_type TEXT NOT NULL DEFAULT 'percentage'
    CHECK (commission_type IN ('percentage', 'fixed')),
  ADD COLUMN IF NOT EXISTS commission_base TEXT NOT NULL DEFAULT 'profit'
    CHECK (commission_base IN ('profit', 'total_sale', 'service_fee'));

-- ============================================================
-- 4. Booking ownership
--    Names are stored denormalised so the audit trail is preserved
--    even if a staff member is later deleted.
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS created_by_name TEXT,
  ADD COLUMN IF NOT EXISTS issued_by_name  TEXT;

-- ============================================================
-- 5. Per-booking commission tracking
--
--    commission_amount   computed amount earned by the assigned agent
--    commission_paid     whether this booking's commission was paid out
--    commission_paid_at  when it was paid
--    commission_notes    optional memo from the owner/admin
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS commission_amount   NUMERIC     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_paid     BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_paid_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS commission_notes    TEXT;
