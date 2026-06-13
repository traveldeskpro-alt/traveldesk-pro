-- ============================================================
-- TravelDesk Pro — Migration 002
-- Secure Registration: Atomic Server-Side Bootstrap
-- Status: PENDING APPROVAL — do not run without review
-- Depends on: 001_fix_rls_recursion.sql
-- ============================================================
--
-- WHY THIS IS NEEDED
-- ------------------
-- Migration 001 leaves two residual risks in the registration flow:
--
-- Risk A — Unlimited agency creation
--   agencies_insert uses WITH CHECK (true), allowing any authenticated
--   user to INSERT as many agency rows as they want. The application
--   prevents this in practice, but there is no database-level guard.
--
-- Risk B — Privilege escalation via malicious agency_id
--   users_insert_self checks (id = auth.uid()) but does NOT validate
--   the agency_id column. A malicious user can:
--     1. Register normally → gets their own auth.uid()
--     2. INSERT INTO users (id='their-uid', agency_id='victim-uuid', role='owner')
--     3. get_my_agency_id() now returns victim's agency_id
--     4. All SELECT / UPDATE / DELETE policies return victim's data
--
-- FIX
-- ---
-- Replace direct client-side INSERTs with a single SECURITY DEFINER
-- function (register_agency) that:
--   • Runs as postgres, bypassing RLS
--   • Creates agency + user profile in one atomic transaction
--   • Guards against duplicate registrations
--   • Validates the plan value against the allowed set
--
-- After this migration, the agencies_insert and users_insert_self
-- policies from migration 001 are dropped — direct INSERT is no
-- longer possible from the client.
--
-- CODE CHANGE REQUIRED
-- --------------------
-- src/context/AuthContext.ts register() must replace the two
-- direct .insert() calls with a single:
--   await supabase.rpc('register_agency', { p_agency_name, p_email, ... })
-- This is a follow-up code change tracked separately and is NOT
-- part of this migration file.
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Atomic registration function
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.register_agency(
  p_agency_name TEXT,
  p_email       TEXT,
  p_phone       TEXT,
  p_address     TEXT DEFAULT '',
  p_cr_number   TEXT DEFAULT '',
  p_currency    TEXT DEFAULT 'OMR',
  p_language    TEXT DEFAULT 'en',
  p_plan        TEXT DEFAULT 'starter'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid;
  v_agency_id uuid;
BEGIN
  -- Must be authenticated
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'register_agency: not authenticated';
  END IF;

  -- Prevent duplicate registrations: one user, one agency
  IF EXISTS (SELECT 1 FROM public.users WHERE id = v_uid) THEN
    RAISE EXCEPTION 'register_agency: user already has an agency profile';
  END IF;

  -- Validate plan against the allowed set (mirrors the DB CHECK constraint)
  IF p_plan NOT IN ('starter', 'professional', 'enterprise') THEN
    RAISE EXCEPTION 'register_agency: invalid plan value "%"', p_plan;
  END IF;

  -- Validate currency is a non-empty string
  IF p_currency IS NULL OR trim(p_currency) = '' THEN
    RAISE EXCEPTION 'register_agency: currency cannot be empty';
  END IF;

  -- Create the agency
  INSERT INTO public.agencies (
    name, email, phone, address, cr_number,
    currency, language, status, plan
  )
  VALUES (
    p_agency_name, p_email, p_phone, p_address, p_cr_number,
    p_currency, p_language, 'trial', p_plan
  )
  RETURNING id INTO v_agency_id;

  -- Create the owner profile, bound to this specific agency
  INSERT INTO public.users (id, agency_id, email, name, role, active)
  VALUES (v_uid, v_agency_id, p_email, p_agency_name, 'owner', TRUE);

  RETURN jsonb_build_object('agency_id', v_agency_id);
END;
$$;

COMMENT ON FUNCTION public.register_agency IS
  'Atomically creates a new agency and owner user profile for the '
  'currently authenticated Supabase Auth user. Runs as SECURITY DEFINER '
  'to bypass RLS during the bootstrap phase. Prevents duplicate '
  'registrations and enforces valid plan/currency values. '
  'The client must call this via supabase.rpc() instead of direct INSERTs.';

GRANT EXECUTE ON FUNCTION public.register_agency TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Remove the permissive bootstrap policies from 001
--         Now that register_agency() handles creation server-side,
--         clients no longer need direct INSERT on agencies or users.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS agencies_insert    ON public.agencies;
DROP POLICY IF EXISTS users_insert_self  ON public.users;

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Invite-user function (for owners adding team members)
--         Without users_insert_self, team member invitations also
--         need a server-side path. This function lets owners INSERT
--         a user row into their own agency after Supabase Auth has
--         created the auth record (e.g. via magic link invite).
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.invite_user_to_agency(
  p_user_id uuid,
  p_email   TEXT,
  p_name    TEXT,
  p_role    TEXT DEFAULT 'agent'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id uuid;
BEGIN
  -- Caller must be an authenticated owner or admin
  v_agency_id := get_my_agency_id();
  IF v_agency_id IS NULL THEN
    RAISE EXCEPTION 'invite_user_to_agency: caller has no agency';
  END IF;

  -- Only owners and admins may invite
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND agency_id = v_agency_id
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'invite_user_to_agency: insufficient role';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'manager', 'agent', 'accountant', 'viewer') THEN
    RAISE EXCEPTION 'invite_user_to_agency: invalid role "%"', p_role;
  END IF;

  -- Create the profile, locked to the caller's agency
  INSERT INTO public.users (id, agency_id, email, name, role, active)
  VALUES (p_user_id, v_agency_id, p_email, p_name, p_role, TRUE)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.invite_user_to_agency IS
  'Creates a user profile for an already-invited Supabase Auth user, '
  'binding them to the calling owner/admin''s agency. '
  'Called after the invited user completes their magic-link signup.';

GRANT EXECUTE ON FUNCTION public.invite_user_to_agency TO authenticated;

COMMIT;

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES (run after applying)
-- ─────────────────────────────────────────────────────────────
--
-- Confirm bootstrap INSERT policies are gone:
--   SELECT policyname FROM pg_policies
--   WHERE tablename IN ('agencies', 'users')
--   AND cmd = 'INSERT';
--   -- Should return 0 rows
--
-- Confirm register_agency function exists and is SECURITY DEFINER:
--   SELECT proname, prosecdef FROM pg_proc
--   WHERE proname IN ('register_agency', 'invite_user_to_agency');
--   -- prosecdef should be TRUE for both
--
-- Test registration (replace with real values):
--   SELECT register_agency(
--     'My Agency', 'owner@myagency.om', '+968 9000 0000'
--   );
-- ─────────────────────────────────────────────────────────────
