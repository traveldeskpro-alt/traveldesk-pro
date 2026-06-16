-- Repair remaining SaaS Admin delete/audit issues on live databases that had
-- stricter audit_logs constraints before the SaaS Admin patch migrations.

BEGIN;

ALTER TABLE public.audit_logs
  ALTER COLUMN admin_user_id DROP NOT NULL,
  ALTER COLUMN target_agency_id DROP NOT NULL,
  ALTER COLUMN target_agency_name DROP NOT NULL,
  ALTER COLUMN notes DROP NOT NULL;

UPDATE public.audit_logs
SET
  id = COALESCE(id, uuid_generate_v4()),
  created_at = COALESCE(created_at, now()),
  admin_email = COALESCE(NULLIF(admin_email, ''), 'unknown-admin'),
  action = COALESCE(NULLIF(action, ''), 'Unknown action');

ALTER TABLE public.audit_logs
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN admin_email SET NOT NULL,
  ALTER COLUMN action SET NOT NULL;

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
    COALESCE(NULLIF(p_action, ''), 'Unknown action'),
    p_target_agency_id,
    NULLIF(p_target_agency_name, ''),
    NULLIF(p_notes, '')
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
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

  -- Log while the agency still exists so older audit_logs foreign keys remain valid.
  PERFORM public.saas_admin_log_action('Agency deleted', p_agency_id, v_agency_name, p_notes);

  -- Preserve audit history by name, but release older FK references before deletion.
  UPDATE public.audit_logs
  SET target_agency_id = NULL,
      target_agency_name = COALESCE(target_agency_name, v_agency_name)
  WHERE target_agency_id = p_agency_id;

  DELETE FROM public.payments WHERE agency_id = p_agency_id;
  DELETE FROM public.invoices WHERE agency_id = p_agency_id;
  DELETE FROM public.bookings WHERE agency_id = p_agency_id;
  DELETE FROM public.customers WHERE agency_id = p_agency_id;
  DELETE FROM public.agents WHERE agency_id = p_agency_id;
  DELETE FROM public.users WHERE agency_id = p_agency_id;
  DELETE FROM public.agencies WHERE id = p_agency_id;
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

  PERFORM public.saas_admin_log_action(
    'Plan edited',
    NULL,
    NULL,
    COALESCE(NULLIF(p_notes, ''), 'Edited plan ' || v_plan.name)
  );
  RETURN v_plan;
END;
$$;

GRANT EXECUTE ON FUNCTION public.saas_admin_log_action(text, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_delete_agency(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_update_subscription_plan(text, text, numeric, integer, integer, text[], text) TO authenticated;

COMMIT;
