-- Functional SaaS Admin management: editable plans, audit logs, and
-- super-admin-only agency actions.

BEGIN;

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id text PRIMARY KEY CHECK (id IN ('starter', 'professional', 'enterprise')),
  name text NOT NULL,
  monthly_price numeric NOT NULL CHECK (monthly_price >= 0),
  user_limit integer CHECK (user_limit IS NULL OR user_limit >= 0),
  booking_limit integer CHECK (booking_limit IS NULL OR booking_limit >= 0),
  features text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.subscription_plans (id, name, monthly_price, user_limit, booking_limit, features)
VALUES
  ('starter', 'Starter', 30, 3, 300, ARRAY['3 users', '300 bookings/month', 'Basic invoices', 'Basic reports']),
  ('professional', 'Professional', 40, 10, NULL, ARRAY['10 users', 'Unlimited bookings', 'Advanced reports', 'WhatsApp invoice sharing', 'Agent commission tracking']),
  ('enterprise', 'Enterprise', 150, NULL, NULL, ARRAY['Multi-branch', 'White-label branding', 'Custom domain', 'Priority support', 'API integrations'])
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_user_id uuid,
  admin_email text NOT NULL,
  action text NOT NULL,
  target_agency_id uuid,
  target_agency_name text,
  notes text
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscription_plans_select ON public.subscription_plans;
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;

CREATE POLICY subscription_plans_select ON public.subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE OR REPLACE FUNCTION public.get_my_agency_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT u.agency_id
  FROM public.users u
  JOIN public.agencies a ON a.id = u.agency_id
  WHERE u.id = auth.uid()
    AND u.active = true
    AND a.status IN ('active', 'trial')
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
    AND active = true
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

CREATE OR REPLACE FUNCTION public.saas_admin_log_action(
  p_action text,
  p_target_agency_id uuid DEFAULT NULL,
  p_target_agency_name text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_admin_user_id uuid;
  v_admin_email text;
BEGIN
  SELECT id, email
    INTO v_admin_user_id, v_admin_email
  FROM public.users
  WHERE id = auth.uid()
    AND role = 'super_admin'
    AND active = true;

  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Only super_admin can perform SaaS Admin actions'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.audit_logs (
    admin_user_id,
    admin_email,
    action,
    target_agency_id,
    target_agency_name,
    notes
  )
  VALUES (
    v_admin_user_id,
    COALESCE(NULLIF(auth.jwt() ->> 'email', ''), v_admin_email),
    p_action,
    p_target_agency_id,
    p_target_agency_name,
    p_notes
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.saas_admin_update_agency(
  p_agency_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_status text,
  p_notes text DEFAULT NULL
)
  RETURNS public.agencies
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_agency public.agencies;
BEGIN
  PERFORM public.saas_admin_log_action('Agency updated', p_agency_id, p_name, p_notes);

  IF p_status NOT IN ('active', 'trial', 'suspended') THEN
    RAISE EXCEPTION 'Invalid agency status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.agencies
  SET
    name = trim(p_name),
    email = trim(p_email),
    phone = trim(p_phone),
    status = p_status,
    updated_at = now()
  WHERE id = p_agency_id
  RETURNING * INTO v_agency;

  IF v_agency.id IS NULL THEN
    RAISE EXCEPTION 'Agency not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_agency;
END;
$$;

CREATE OR REPLACE FUNCTION public.saas_admin_suspend_agency(
  p_agency_id uuid,
  p_notes text DEFAULT NULL
)
  RETURNS public.agencies
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_agency public.agencies;
BEGIN
  UPDATE public.agencies
  SET status = 'suspended', updated_at = now()
  WHERE id = p_agency_id
  RETURNING * INTO v_agency;

  IF v_agency.id IS NULL THEN
    RAISE EXCEPTION 'Agency not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.users
  SET active = false
  WHERE agency_id = p_agency_id
    AND role <> 'super_admin';

  PERFORM public.saas_admin_log_action('Agency suspended', p_agency_id, v_agency.name, p_notes);
  RETURN v_agency;
END;
$$;

CREATE OR REPLACE FUNCTION public.saas_admin_activate_agency(
  p_agency_id uuid,
  p_notes text DEFAULT NULL
)
  RETURNS public.agencies
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_agency public.agencies;
BEGIN
  UPDATE public.agencies
  SET status = 'active', updated_at = now()
  WHERE id = p_agency_id
  RETURNING * INTO v_agency;

  IF v_agency.id IS NULL THEN
    RAISE EXCEPTION 'Agency not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.users
  SET active = true
  WHERE agency_id = p_agency_id
    AND role <> 'super_admin';

  PERFORM public.saas_admin_log_action('Agency activated', p_agency_id, v_agency.name, p_notes);
  RETURN v_agency;
END;
$$;

CREATE OR REPLACE FUNCTION public.saas_admin_change_agency_plan(
  p_agency_id uuid,
  p_plan_id text,
  p_notes text DEFAULT NULL
)
  RETURNS public.agencies
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_agency public.agencies;
  v_plan_name text;
BEGIN
  SELECT name INTO v_plan_name
  FROM public.subscription_plans
  WHERE id = p_plan_id
    AND is_active = true;

  IF v_plan_name IS NULL THEN
    RAISE EXCEPTION 'Plan not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.agencies
  SET plan = p_plan_id, updated_at = now()
  WHERE id = p_agency_id
  RETURNING * INTO v_agency;

  IF v_agency.id IS NULL THEN
    RAISE EXCEPTION 'Agency not found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public.saas_admin_log_action(
    'Plan changed',
    p_agency_id,
    v_agency.name,
    COALESCE(p_notes, 'Changed agency plan to ' || v_plan_name)
  );

  RETURN v_agency;
END;
$$;

CREATE OR REPLACE FUNCTION public.saas_admin_delete_agency(
  p_agency_id uuid,
  p_notes text DEFAULT NULL
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_agency_name text;
BEGIN
  SELECT name INTO v_agency_name
  FROM public.agencies
  WHERE id = p_agency_id;

  IF v_agency_name IS NULL THEN
    RAISE EXCEPTION 'Agency not found' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.users
    WHERE agency_id = p_agency_id
      AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Cannot delete a super_admin account'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.payments WHERE agency_id = p_agency_id;
  DELETE FROM public.invoices WHERE agency_id = p_agency_id;
  DELETE FROM public.bookings WHERE agency_id = p_agency_id;
  DELETE FROM public.customers WHERE agency_id = p_agency_id;
  DELETE FROM public.agents WHERE agency_id = p_agency_id;
  DELETE FROM public.users WHERE agency_id = p_agency_id;
  DELETE FROM public.agencies WHERE id = p_agency_id;

  PERFORM public.saas_admin_log_action('Agency deleted', p_agency_id, v_agency_name, p_notes);
END;
$$;

CREATE OR REPLACE FUNCTION public.saas_admin_update_subscription_plan(
  p_plan_id text,
  p_name text,
  p_monthly_price numeric,
  p_user_limit integer,
  p_booking_limit integer,
  p_features text[],
  p_notes text DEFAULT NULL
)
  RETURNS public.subscription_plans
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_plan public.subscription_plans;
BEGIN
  IF p_monthly_price < 0 THEN
    RAISE EXCEPTION 'Monthly price must be non-negative' USING ERRCODE = '22023';
  END IF;

  UPDATE public.subscription_plans
  SET
    name = trim(p_name),
    monthly_price = p_monthly_price,
    user_limit = p_user_limit,
    booking_limit = p_booking_limit,
    features = COALESCE(p_features, '{}'),
    updated_at = now()
  WHERE id = p_plan_id
  RETURNING * INTO v_plan;

  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan not found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public.saas_admin_log_action('Plan edited', NULL, NULL, COALESCE(p_notes, 'Edited plan ' || v_plan.name));
  RETURN v_plan;
END;
$$;

GRANT EXECUTE ON FUNCTION public.saas_admin_log_action(text, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_update_agency(uuid, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_suspend_agency(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_activate_agency(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_change_agency_plan(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_delete_agency(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_update_subscription_plan(text, text, numeric, integer, integer, text[], text) TO authenticated;

COMMIT;
