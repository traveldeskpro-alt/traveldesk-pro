-- ============================================================
-- 017. BOOKING -> INVOICE -> PAYMENT FOUNDATION
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Link invoice to booking
-- ------------------------------------------------------------

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS booking_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invoices_booking_id_fkey'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_booking_id_fkey
      FOREIGN KEY (booking_id)
      REFERENCES public.bookings(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- ------------------------------------------------------------
-- 2. Invoice payment tracking
-- ------------------------------------------------------------

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS balance_due numeric NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invoices_amount_paid_nonnegative'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_amount_paid_nonnegative
      CHECK (amount_paid >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invoices_balance_due_nonnegative'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_balance_due_nonnegative
      CHECK (balance_due >= 0);
  END IF;
END
$$;

-- ------------------------------------------------------------
-- 3. Agency-wise invoice number uniqueness
-- ------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS invoices_agency_invoice_number_unique
  ON public.invoices (agency_id, invoice_number);

-- ------------------------------------------------------------
-- 4. Indexes
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS bookings_agency_id_idx
  ON public.bookings (agency_id);

CREATE INDEX IF NOT EXISTS bookings_customer_id_idx
  ON public.bookings (customer_id);

CREATE INDEX IF NOT EXISTS invoices_agency_id_idx
  ON public.invoices (agency_id);

CREATE INDEX IF NOT EXISTS invoices_customer_id_idx
  ON public.invoices (customer_id);

CREATE INDEX IF NOT EXISTS invoices_booking_id_idx
  ON public.invoices (booking_id);

CREATE INDEX IF NOT EXISTS invoices_status_idx
  ON public.invoices (agency_id, status);

CREATE INDEX IF NOT EXISTS payments_agency_id_idx
  ON public.payments (agency_id);

CREATE INDEX IF NOT EXISTS payments_invoice_id_idx
  ON public.payments (invoice_id);

CREATE INDEX IF NOT EXISTS payments_created_at_idx
  ON public.payments (agency_id, created_at);

-- ------------------------------------------------------------
-- 5. Payment amount validation
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_amount_positive'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_amount_positive
      CHECK (amount > 0);
  END IF;
END
$$;

-- ------------------------------------------------------------
-- 6. Secure invoice total recalculation
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recalculate_invoice_payment_totals(
  target_invoice_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  invoice_total numeric;
  paid_total numeric;
BEGIN
  SELECT COALESCE(total, 0)
  INTO invoice_total
  FROM public.invoices
  WHERE id = target_invoice_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(amount), 0)
  INTO paid_total
  FROM public.payments
  WHERE invoice_id = target_invoice_id;

  UPDATE public.invoices
  SET
    amount_paid = paid_total,
    balance_due = GREATEST(invoice_total - paid_total, 0),
    status = CASE
      WHEN paid_total <= 0 THEN 'pending'
      WHEN paid_total < invoice_total THEN 'pending'
      ELSE 'paid'
    END,
    paid_at = CASE
      WHEN paid_total >= invoice_total
        THEN COALESCE(paid_at, now())
      ELSE NULL
    END
  WHERE id = target_invoice_id;
END;
$function$;

REVOKE ALL
ON FUNCTION public.recalculate_invoice_payment_totals(uuid)
FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- 7. Validate payment and invoice belong to same agency
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_payment_invoice_agency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  invoice_agency_id uuid;
BEGIN
  SELECT agency_id
  INTO invoice_agency_id
  FROM public.invoices
  WHERE id = NEW.invoice_id;

  IF invoice_agency_id IS NULL THEN
    RAISE EXCEPTION 'Invoice does not exist';
  END IF;

  IF NEW.agency_id IS DISTINCT FROM invoice_agency_id THEN
    RAISE EXCEPTION 'Payment and invoice must belong to the same agency';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL
ON FUNCTION public.validate_payment_invoice_agency()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS payments_validate_invoice_agency
ON public.payments;

CREATE TRIGGER payments_validate_invoice_agency
BEFORE INSERT OR UPDATE OF agency_id, invoice_id
ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.validate_payment_invoice_agency();

-- ------------------------------------------------------------
-- 8. Recalculate invoice after payment changes
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_payment_invoice_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_invoice_payment_totals(OLD.invoice_id);
    RETURN OLD;
  END IF;

  PERFORM public.recalculate_invoice_payment_totals(NEW.invoice_id);

  IF TG_OP = 'UPDATE'
     AND OLD.invoice_id IS DISTINCT FROM NEW.invoice_id THEN
    PERFORM public.recalculate_invoice_payment_totals(OLD.invoice_id);
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL
ON FUNCTION public.handle_payment_invoice_totals()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS payments_recalculate_invoice_totals
ON public.payments;

CREATE TRIGGER payments_recalculate_invoice_totals
AFTER INSERT OR UPDATE OR DELETE
ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.handle_payment_invoice_totals();

-- ------------------------------------------------------------
-- 9. Recalculate invoice after invoice total changes
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_invoice_total_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM public.recalculate_invoice_payment_totals(NEW.id);
  RETURN NEW;
END;
$function$;

REVOKE ALL
ON FUNCTION public.handle_invoice_total_change()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS invoices_recalculate_payment_totals
ON public.invoices;

CREATE TRIGGER invoices_recalculate_payment_totals
AFTER INSERT OR UPDATE OF total
ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.handle_invoice_total_change();

-- ------------------------------------------------------------
-- 10. Preserve RLS
-- ------------------------------------------------------------

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

COMMIT;