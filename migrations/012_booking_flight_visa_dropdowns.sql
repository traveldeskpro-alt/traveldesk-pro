-- ============================================================
-- Migration 012 — Smart Booking Types: Flight & Visa Fields
--
-- 1. Expand booking type CHECK constraint to include insurance
--    and other_service (keeping existing values intact)
-- 2. Add flight-ticket-specific columns
-- 3. Add visa-specific columns
-- 4. All changes use ADD COLUMN IF NOT EXISTS — fully safe to
--    run on a live database; zero data loss for existing rows.
-- ============================================================

-- 1. Expand the type CHECK constraint
--    Drop the existing constraint by name, then re-create it.
--    NOTE: The constraint name in supabase_schema.sql is inlined
--    in the column definition. In Postgres, unnamed inline CHECKs
--    receive an auto-generated name like bookings_type_check.
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_type_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_type_check
    CHECK (type IN (
      'air_ticket',
      'visa',
      'hotel',
      'group_tour',
      'insurance',
      'other_service'
    ));

-- 2. Flight Ticket specific columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS airline_code       TEXT,
  ADD COLUMN IF NOT EXISTS route_from         TEXT,
  ADD COLUMN IF NOT EXISTS route_to           TEXT,
  ADD COLUMN IF NOT EXISTS departure_date     TEXT,
  ADD COLUMN IF NOT EXISTS return_date        TEXT,
  ADD COLUMN IF NOT EXISTS passenger_name     TEXT;

-- 3. Visa specific columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS visa_type                TEXT,
  ADD COLUMN IF NOT EXISTS application_date         TEXT,
  ADD COLUMN IF NOT EXISTS expected_approval_date   TEXT,
  ADD COLUMN IF NOT EXISTS passport_number          TEXT;

-- Notes:
--  • airline        — already exists (free-text airline name)
--  • pnr            — already exists
--  • ticket_number  — already exists
--  • visa_country   — already exists
--  • passenger_name — shared between flight and visa bookings
--  • All new columns are nullable TEXT; no default needed.
--  • Existing rows will have NULL for all new columns, which is
--    handled gracefully by the application layer.
