-- SaaS Admin agency creation/status management support.
-- Keep owners active so suspended agencies can show an in-app suspension notice.

BEGIN;

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
    AND active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.saas_admin_set_agency_status(
  p_agency_id uuid,
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
  v_action text;
BEGIN
  IF p_status NOT IN ('active', 'trial', 'suspended') THEN
    RAISE EXCEPTION 'Invalid agency status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.agencies
  SET status = p_status, updated_at = now()
  WHERE id = p_agency_id
  RETURNING * INTO v_agency;

  IF v_agency.id IS NULL THEN
    RAISE EXCEPTION 'Agency not found' USING ERRCODE = 'P0002';
  END IF;

  -- Owners must stay active to sign in and see the suspension notice.
  UPDATE public.users
  SET active = true
  WHERE agency_id = p_agency_id
    AND role = 'owner';

  v_action := CASE p_status
    WHEN 'active' THEN 'Agency activated'
    WHEN 'trial' THEN 'Agency set to trial'
    ELSE 'Agency suspended'
  END;

  PERFORM public.saas_admin_log_action(
    v_action,
    p_agency_id,
    v_agency.name,
    COALESCE(p_notes, 'Set agency status to ' || p_status)
  );

  RETURN v_agency;
END;
$$;

CREATE OR REPLACE FUNCTION public.saas_admin_activate_agency(
  p_agency_id uuid,
  p_notes text DEFAULT NULL
)
  RETURNS public.agencies
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT public.saas_admin_set_agency_status(p_agency_id, 'active', p_notes);
$$;

CREATE OR REPLACE FUNCTION public.saas_admin_suspend_agency(
  p_agency_id uuid,
  p_notes text DEFAULT NULL
)
  RETURNS public.agencies
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT public.saas_admin_set_agency_status(p_agency_id, 'suspended', p_notes);
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
  v_action text;
BEGIN
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

  UPDATE public.users
  SET active = true
  WHERE agency_id = p_agency_id
    AND role = 'owner';

  v_action := CASE p_status
    WHEN 'active' THEN 'Agency activated'
    WHEN 'trial' THEN 'Agency set to trial'
    ELSE 'Agency suspended'
  END;

  PERFORM public.saas_admin_log_action(
    v_action,
    p_agency_id,
    v_agency.name,
    COALESCE(p_notes, 'Updated agency details and status')
  );

  RETURN v_agency;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_agency_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_set_agency_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_activate_agency(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_suspend_agency(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_admin_update_agency(uuid, text, text, text, text, text) TO authenticated;

COMMIT;
