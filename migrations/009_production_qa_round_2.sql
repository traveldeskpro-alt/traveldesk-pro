-- Production QA round 2 fixes:
-- - agency calendar events
-- - agency logo storage
-- - invoice branding snapshots
-- - agency-managed team profiles

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  type text NOT NULL DEFAULT 'meeting' CHECK (type IN ('meeting', 'deadline', 'reminder', 'travel', 'booking')),
  customer_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'calendar_events'
      AND policyname = 'calendar_events_isolation'
  ) THEN
    CREATE POLICY calendar_events_isolation ON public.calendar_events
      FOR ALL
      USING (agency_id = public.get_my_agency_id())
      WITH CHECK (agency_id = public.get_my_agency_id());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS calendar_events_agency_start_idx
  ON public.calendar_events (agency_id, start_at);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS agency_branding jsonb;

-- Team profiles are agency records. Auth-linked users still use auth.uid()
-- as their profile id; manually added staff profiles receive generated UUIDs.
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

ALTER TABLE public.users
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'users_insert'
  ) THEN
    CREATE POLICY users_insert ON public.users
      FOR INSERT
      WITH CHECK (
        agency_id = public.get_my_agency_id()
        AND public.get_my_role() IN ('owner', 'admin')
      );
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-assets', 'agency-assets', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'agency_assets_select'
  ) THEN
    CREATE POLICY agency_assets_select ON storage.objects
      FOR SELECT
      USING (bucket_id = 'agency-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'agency_assets_insert'
  ) THEN
    CREATE POLICY agency_assets_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'agency-assets'
        AND (storage.foldername(name))[1] = public.get_my_agency_id()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'agency_assets_update'
  ) THEN
    CREATE POLICY agency_assets_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'agency-assets'
        AND (storage.foldername(name))[1] = public.get_my_agency_id()::text
      )
      WITH CHECK (
        bucket_id = 'agency-assets'
        AND (storage.foldername(name))[1] = public.get_my_agency_id()::text
      );
  END IF;
END $$;
