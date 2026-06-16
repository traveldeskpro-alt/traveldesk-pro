-- Repair production SaaS Admin audit log schema drift without destructive changes.
-- The 005 migration expects audit_logs.admin_email; some live databases already
-- had an older audit_logs table without that column.

BEGIN;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT uuid_generate_v4();

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS admin_user_id uuid;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS admin_email text;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS action text;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS target_agency_id uuid;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS target_agency_name text;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS notes text;

UPDATE public.audit_logs
SET
  id = COALESCE(id, uuid_generate_v4()),
  created_at = COALESCE(created_at, now()),
  admin_email = COALESCE(NULLIF(admin_email, ''), 'unknown-admin'),
  action = COALESCE(NULLIF(action, ''), 'Unknown action')
WHERE id IS NULL
   OR created_at IS NULL
   OR admin_email IS NULL
   OR admin_email = ''
   OR action IS NULL
   OR action = '';

ALTER TABLE public.audit_logs
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN admin_email SET NOT NULL,
  ALTER COLUMN action SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.audit_logs'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.audit_logs ADD PRIMARY KEY (id);
  END IF;
END $$;

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
    COALESCE(NULLIF(auth.jwt() ->> 'email', ''), v_admin_email, 'unknown-admin'),
    p_action,
    p_target_agency_id,
    p_target_agency_name,
    p_notes
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
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

  IF p_status = 'suspended' THEN
    UPDATE public.users
    SET active = false
    WHERE agency_id = p_agency_id
      AND role <> 'super_admin';
  ELSIF p_status = 'active' THEN
    UPDATE public.users
    SET active = true
    WHERE agency_id = p_agency_id
      AND role <> 'super_admin';
  END IF;

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
