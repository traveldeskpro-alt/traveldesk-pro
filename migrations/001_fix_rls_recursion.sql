-- ============================================================
-- TravelDesk Pro — Migration 001
-- Fix RLS Self-Referencing Recursion
-- Status: PENDING APPROVAL — do not run without review
-- ============================================================
--
-- WHAT IS BROKEN
-- --------------
-- Every existing policy resolves the current user's agency via:
--
--   agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid())
--
-- The users table itself has a policy (users_isolation) that uses
-- the same subquery pattern. When PostgreSQL evaluates ANY policy
-- that queries the users table, it triggers users_isolation, which
-- in turn re-queries the users table, which triggers users_isolation
-- again — infinite recursion → "ERROR: stack depth limit exceeded".
--
-- Because ALL seven policies share the same subquery against users,
-- ALL of them are affected, not just users_isolation.
--
-- FIX
-- ---
-- Replace the inline subquery with a SECURITY DEFINER helper function.
-- SECURITY DEFINER makes the function execute with the privileges of
-- its owner (postgres) rather than the calling role. PostgreSQL skips
-- RLS for security-definer functions, so the self-reference is broken.
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Helper function — reads users without triggering RLS
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_agency_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT agency_id
  FROM   public.users
  WHERE  id = auth.uid()
  LIMIT  1;
$$;

COMMENT ON FUNCTION public.get_my_agency_id() IS
  'Returns the agency_id for the currently authenticated user by reading '
  'the users table with SECURITY DEFINER, bypassing RLS to prevent the '
  'infinite recursion caused by policies that subquery the users table.';

GRANT EXECUTE ON FUNCTION public.get_my_agency_id() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Drop all broken policies
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS agencies_isolation  ON public.agencies;
DROP POLICY IF EXISTS users_isolation     ON public.users;
DROP POLICY IF EXISTS customers_isolation ON public.customers;
DROP POLICY IF EXISTS bookings_isolation  ON public.bookings;
DROP POLICY IF EXISTS invoices_isolation  ON public.invoices;
DROP POLICY IF EXISTS agents_isolation    ON public.agents;
DROP POLICY IF EXISTS payments_isolation  ON public.payments;

-- ─────────────────────────────────────────────────────────────
-- STEP 3: agencies
--
-- SELECT / UPDATE / DELETE: restricted to the user's own agency.
--
-- INSERT: intentionally open for authenticated users.
--   Rationale: a new user completes signUp → has auth.uid() but
--   no users profile row yet → get_my_agency_id() returns NULL →
--   a strict check would block the initial agency INSERT.
--   Migration 002 removes this open policy and replaces the
--   direct INSERT with a server-side SECURITY DEFINER function
--   that creates agency + user profile atomically.
-- ─────────────────────────────────────────────────────────────

CREATE POLICY agencies_select ON public.agencies
  FOR SELECT
  TO authenticated
  USING ( id = get_my_agency_id() );

CREATE POLICY agencies_insert ON public.agencies
  FOR INSERT
  TO authenticated
  WITH CHECK ( true );
  -- NOTE: Intentionally permissive; see migration 002 for the
  -- tight server-side replacement.

CREATE POLICY agencies_update ON public.agencies
  FOR UPDATE
  TO authenticated
  USING      ( id = get_my_agency_id() )
  WITH CHECK ( id = get_my_agency_id() );

CREATE POLICY agencies_delete ON public.agencies
  FOR DELETE
  TO authenticated
  USING ( id = get_my_agency_id() );

-- ─────────────────────────────────────────────────────────────
-- STEP 4: users
--
-- SELECT / UPDATE / DELETE: all users in the same agency are
--   visible to each other (needed for team management UI).
--
-- INSERT: the user may only insert a row where id = auth.uid().
--   This prevents a user from creating a profile for another uid.
--   It does NOT prevent inserting with a malicious agency_id;
--   migration 002 closes that gap via the server-side function.
-- ─────────────────────────────────────────────────────────────

CREATE POLICY users_select ON public.users
  FOR SELECT
  TO authenticated
  USING ( agency_id = get_my_agency_id() );

CREATE POLICY users_insert_self ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK ( id = auth.uid() );

CREATE POLICY users_update ON public.users
  FOR UPDATE
  TO authenticated
  USING      ( agency_id = get_my_agency_id() )
  WITH CHECK ( agency_id = get_my_agency_id() );

CREATE POLICY users_delete ON public.users
  FOR DELETE
  TO authenticated
  USING ( agency_id = get_my_agency_id() );

-- ─────────────────────────────────────────────────────────────
-- STEP 5: customers
-- ─────────────────────────────────────────────────────────────

CREATE POLICY customers_isolation ON public.customers
  FOR ALL
  TO authenticated
  USING      ( agency_id = get_my_agency_id() )
  WITH CHECK ( agency_id = get_my_agency_id() );

-- ─────────────────────────────────────────────────────────────
-- STEP 6: bookings
-- ─────────────────────────────────────────────────────────────

CREATE POLICY bookings_isolation ON public.bookings
  FOR ALL
  TO authenticated
  USING      ( agency_id = get_my_agency_id() )
  WITH CHECK ( agency_id = get_my_agency_id() );

-- ─────────────────────────────────────────────────────────────
-- STEP 7: invoices
-- ─────────────────────────────────────────────────────────────

CREATE POLICY invoices_isolation ON public.invoices
  FOR ALL
  TO authenticated
  USING      ( agency_id = get_my_agency_id() )
  WITH CHECK ( agency_id = get_my_agency_id() );

-- ─────────────────────────────────────────────────────────────
-- STEP 8: agents
-- ─────────────────────────────────────────────────────────────

CREATE POLICY agents_isolation ON public.agents
  FOR ALL
  TO authenticated
  USING      ( agency_id = get_my_agency_id() )
  WITH CHECK ( agency_id = get_my_agency_id() );

-- ─────────────────────────────────────────────────────────────
-- STEP 9: payments
-- ─────────────────────────────────────────────────────────────

CREATE POLICY payments_isolation ON public.payments
  FOR ALL
  TO authenticated
  USING      ( agency_id = get_my_agency_id() )
  WITH CHECK ( agency_id = get_my_agency_id() );

COMMIT;

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES (run after applying)
-- ─────────────────────────────────────────────────────────────
--
-- Check that the helper function exists:
--   SELECT proname, prosecdef FROM pg_proc
--   WHERE proname = 'get_my_agency_id';
--   -- prosecdef should be TRUE
--
-- List all policies (should show NO old *_isolation names except
-- the renamed ones on customers/bookings/invoices/agents/payments):
--   SELECT tablename, policyname, cmd, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
-- ─────────────────────────────────────────────────────────────
