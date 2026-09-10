-- ============================================================
-- 016. PRESERVE AUTH SESSION FOR SUSPENDED AGENCIES
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_my_agency_status()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT a.status
  FROM public.users u
  JOIN public.agencies a
    ON a.id = u.agency_id
  WHERE u.id = auth.uid()
    AND u.active = true
  LIMIT 1;
$function$;

REVOKE ALL
ON FUNCTION public.get_my_agency_status()
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.get_my_agency_status()
TO authenticated;

COMMENT ON FUNCTION public.get_my_agency_status()
IS 'Returns the authenticated user agency status without exposing suspended-agency tenant data through the agencies table RLS policy.';

COMMIT;
