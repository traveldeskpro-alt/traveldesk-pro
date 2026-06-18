-- ============================================================
-- Migration 010 — P0 Production Blockers
--
-- 1. Add missing columns to invoices table
-- 2. Create invoice_sequences table (server-side sequence counter)
-- 3. Add get_next_invoice_number() RPC (atomic, per-agency)
-- 4. Fix agencies_delete RLS — super_admin only
-- 5. Fix agencies_update — BEFORE UPDATE trigger blocks plan
--    self-upgrade for non-super_admin callers
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. Missing invoice columns
-- ============================================================

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS tax_enabled          BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_percentage       NUMERIC     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prefix               TEXT        NOT NULL DEFAULT 'INV',
  ADD COLUMN IF NOT EXISTS sequence             INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_passport    TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone       TEXT,
  ADD COLUMN IF NOT EXISTS customer_email       TEXT,
  ADD COLUMN IF NOT EXISTS customer_nationality TEXT,
  ADD COLUMN IF NOT EXISTS notes                TEXT;

-- ============================================================
-- 2. Invoice sequences table
--    One row per agency. next_sequence is the next number to issue.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  agency_id     uuid        PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
  prefix        TEXT        NOT NULL DEFAULT 'INV',
  next_sequence INTEGER     NOT NULL DEFAULT 1,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename   = 'invoice_sequences'
      AND policyname  = 'invoice_sequences_agency'
  ) THEN
    CREATE POLICY invoice_sequences_agency ON public.invoice_sequences
      FOR ALL
      USING  (agency_id = public.get_my_agency_id())
      WITH CHECK (agency_id = public.get_my_agency_id());
  END IF;
END $$;

-- ============================================================
-- 3. get_next_invoice_number(agency_id, prefix)
--
--    Atomically increments the per-agency counter and returns a
--    formatted invoice number such as "INV-0042".
--    Uses INSERT … ON CONFLICT DO UPDATE to guarantee atomicity
--    even under concurrent requests from multiple users.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_next_invoice_number(
  p_agency_id uuid,
  p_prefix    text DEFAULT 'INV'
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_seq    integer;
  v_prefix text;
BEGIN
  IF NOT (public.is_super_admin() OR p_agency_id = public.get_my_agency_id()) THEN
    RAISE EXCEPTION 'Not authorised to generate invoice numbers for this agency'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.invoice_sequences (agency_id, prefix, next_sequence, updated_at)
  VALUES (p_agency_id, p_prefix, 2, now())
  ON CONFLICT (agency_id) DO UPDATE
    SET next_sequence = invoice_sequences.next_sequence + 1,
        prefix        = EXCLUDED.prefix,
        updated_at    = now()
  RETURNING next_sequence - 1, prefix
    INTO v_seq, v_prefix;

  RETURN v_prefix || '-' || lpad(v_seq::text, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_invoice_number(uuid, text) TO authenticated;

-- ============================================================
-- 4. Fix agencies_delete — only super_admin may delete an agency
-- ============================================================

DROP POLICY IF EXISTS agencies_delete ON public.agencies;

CREATE POLICY agencies_delete ON public.agencies
  FOR DELETE
  USING (public.is_super_admin());

-- ============================================================
-- 5. Block plan self-upgrade via a BEFORE UPDATE trigger
--
--    RLS WITH CHECK cannot reliably compare NEW vs OLD on the same
--    table without recursion risk.  A SECURITY DEFINER trigger is
--    the correct PostgreSQL pattern for blocking specific column
--    changes based on the caller's role.
--
--    The trigger raises an exception when a non-super_admin caller
--    attempts to change the plan column.
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_agency_plan_self_upgrade()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  IF OLD.plan IS DISTINCT FROM NEW.plan THEN
    RAISE EXCEPTION 'Plan changes must be made through the SaaS Admin panel'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agencies_prevent_plan_self_upgrade ON public.agencies;

CREATE TRIGGER agencies_prevent_plan_self_upgrade
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_agency_plan_self_upgrade();
