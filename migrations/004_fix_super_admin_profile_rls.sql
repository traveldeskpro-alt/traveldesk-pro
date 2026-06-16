-- Fix production login for platform super admins whose users.agency_id is NULL.
-- Keeps agency data isolated while allowing every authenticated user to read
-- their own profile row.

BEGIN;

ALTER TABLE public.users
  ALTER COLUMN agency_id DROP NOT NULL;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'owner', 'admin', 'manager', 'agent', 'accountant', 'viewer'));

CREATE OR REPLACE FUNCTION public.get_my_agency_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT agency_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
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

DROP POLICY IF EXISTS agencies_isolation ON public.agencies;
DROP POLICY IF EXISTS agencies_select ON public.agencies;
DROP POLICY IF EXISTS agencies_update ON public.agencies;
DROP POLICY IF EXISTS agencies_delete ON public.agencies;

DROP POLICY IF EXISTS users_isolation ON public.users;
DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS users_delete ON public.users;

DROP POLICY IF EXISTS customers_isolation ON public.customers;
DROP POLICY IF EXISTS bookings_isolation ON public.bookings;
DROP POLICY IF EXISTS invoices_isolation ON public.invoices;
DROP POLICY IF EXISTS agents_isolation ON public.agents;
DROP POLICY IF EXISTS payments_isolation ON public.payments;

CREATE POLICY agencies_select ON public.agencies
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin() OR id = public.get_my_agency_id());

CREATE POLICY agencies_update ON public.agencies
  FOR UPDATE
  TO authenticated
  USING (id = public.get_my_agency_id())
  WITH CHECK (id = public.get_my_agency_id());

CREATE POLICY agencies_delete ON public.agencies
  FOR DELETE
  TO authenticated
  USING (id = public.get_my_agency_id());

CREATE POLICY users_select ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_super_admin()
    OR (agency_id IS NOT NULL AND agency_id = public.get_my_agency_id())
  );

CREATE POLICY users_update ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR (agency_id IS NOT NULL AND agency_id = public.get_my_agency_id())
  )
  WITH CHECK (
    id = auth.uid()
    OR (agency_id IS NOT NULL AND agency_id = public.get_my_agency_id())
  );

CREATE POLICY users_delete ON public.users
  FOR DELETE
  TO authenticated
  USING (agency_id IS NOT NULL AND agency_id = public.get_my_agency_id());

CREATE POLICY customers_isolation ON public.customers
  FOR ALL
  TO authenticated
  USING (agency_id = public.get_my_agency_id())
  WITH CHECK (agency_id = public.get_my_agency_id());

CREATE POLICY bookings_isolation ON public.bookings
  FOR ALL
  TO authenticated
  USING (agency_id = public.get_my_agency_id())
  WITH CHECK (agency_id = public.get_my_agency_id());

CREATE POLICY invoices_isolation ON public.invoices
  FOR ALL
  TO authenticated
  USING (agency_id = public.get_my_agency_id())
  WITH CHECK (agency_id = public.get_my_agency_id());

CREATE POLICY agents_isolation ON public.agents
  FOR ALL
  TO authenticated
  USING (agency_id = public.get_my_agency_id())
  WITH CHECK (agency_id = public.get_my_agency_id());

CREATE POLICY payments_isolation ON public.payments
  FOR ALL
  TO authenticated
  USING (agency_id = public.get_my_agency_id())
  WITH CHECK (agency_id = public.get_my_agency_id());

COMMIT;
