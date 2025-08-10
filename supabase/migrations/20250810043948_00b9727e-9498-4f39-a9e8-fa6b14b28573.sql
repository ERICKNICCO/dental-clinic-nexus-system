-- Ensure professional, safe cash payment flow: cap amounts and sync statuses

-- 1) Validation function to cap amount_paid and normalize payment_status
CREATE OR REPLACE FUNCTION public.validate_payment_amounts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_total int;
BEGIN
  base_total := COALESCE(NULLIF(NEW.final_total, 0), NEW.total_amount, 0);
  IF base_total IS NULL THEN base_total := 0; END IF;

  IF NEW.amount_paid IS NULL THEN NEW.amount_paid := 0; END IF;
  IF NEW.amount_paid < 0 THEN NEW.amount_paid := 0; END IF;
  IF NEW.amount_paid > base_total THEN NEW.amount_paid := base_total; END IF;

  -- Normalize payment_status based on amounts
  IF base_total > 0 AND NEW.amount_paid >= base_total THEN
    NEW.payment_status := 'paid';
  ELSIF NEW.amount_paid > 0 THEN
    NEW.payment_status := 'partial';
  ELSE
    NEW.payment_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Attach triggers
DROP TRIGGER IF EXISTS trg_validate_payment_amounts ON public.payments;
CREATE TRIGGER trg_validate_payment_amounts
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.validate_payment_amounts();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Sync appointment status when payment completes
DROP TRIGGER IF EXISTS trg_sync_appointment_status_on_payment_complete ON public.payments;
CREATE TRIGGER trg_sync_appointment_status_on_payment_complete
AFTER UPDATE ON public.payments
FOR EACH ROW
WHEN (NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid'))
EXECUTE FUNCTION public.sync_appointment_status_on_payment_complete();

-- 3) One-off data correction for INAYA payment (set to 200,000)
UPDATE public.payments
SET amount_paid = 200000,
    payment_status = CASE WHEN COALESCE(NULLIF(final_total,0), total_amount) <= 200000 THEN 'paid' ELSE 'partial' END,
    updated_at = NOW()
WHERE id = '7dcc701c-d905-4e6d-af8c-5beab0c5251a';