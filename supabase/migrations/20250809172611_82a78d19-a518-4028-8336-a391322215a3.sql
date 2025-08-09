-- Fix type mismatch errors and wire up triggers for consultation completion

-- 1) Safer appointment sync functions with proper UUID casting
CREATE OR REPLACE FUNCTION public.sync_appointment_status_on_consultation_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  appt_uuid uuid;
BEGIN
  -- Handle possible text in appointment_id safely
  BEGIN
    appt_uuid := NEW.appointment_id::uuid;
  EXCEPTION WHEN others THEN
    appt_uuid := NULL;
  END;

  -- Trigger when consultation status changes to 'in-progress' (consultation starts)
  IF NEW.status = 'in-progress' AND (OLD.status IS NULL OR OLD.status != 'in-progress') THEN
    IF appt_uuid IS NOT NULL THEN
      UPDATE appointments 
      SET status = 'In Progress', updated_at = NOW()
      WHERE id = appt_uuid;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_appointment_status_on_consultation_complete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  appt_uuid uuid;
BEGIN
  -- Only trigger when consultation status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    BEGIN
      appt_uuid := NEW.appointment_id::uuid;
    EXCEPTION WHEN others THEN
      appt_uuid := NULL;
    END;

    IF appt_uuid IS NOT NULL THEN
      UPDATE appointments 
      SET status = 'Completed', updated_at = NOW()
      WHERE id = appt_uuid;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2) Harden consultation status updater to avoid uuid=text comparisons
CREATE OR REPLACE FUNCTION public.update_consultation_status(consultation_id uuid, new_status text, completed_at timestamp with time zone DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE consultations 
  SET 
    status = new_status,
    completed_at = COALESCE(completed_at, CASE WHEN new_status = 'completed' THEN now() ELSE consultations.completed_at END),
    updated_at = now()
  WHERE id = consultation_id::uuid; -- ensure uuid on both sides
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation with ID % not found', consultation_id;
  END IF;
END;
$$;

-- 3) Ensure payment creation function is present (already created earlier), keep it but ensure search_path
CREATE OR REPLACE FUNCTION public.create_payment_on_consultation_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  appt_uuid uuid;
  patient_uuid uuid;
  existing_count int;
  total_amount numeric := 0;
  payment_method text := 'cash';
  insurance_provider text := NULL;
  patient_name text := NULL;
  treatment_name text := NULL;
BEGIN
  IF NOT (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO existing_count FROM payments WHERE consultation_id = NEW.id::text;
  IF existing_count > 0 THEN
    RETURN NEW;
  END IF;

  BEGIN
    appt_uuid := NEW.appointment_id::uuid;
  EXCEPTION WHEN others THEN
    appt_uuid := NULL;
  END;

  BEGIN
    patient_uuid := NEW.patient_id::uuid;
  EXCEPTION WHEN others THEN
    patient_uuid := NULL;
  END;

  IF patient_uuid IS NOT NULL THEN
    SELECT name, patient_type, insurance INTO patient_name, payment_method, insurance_provider
    FROM patients
    WHERE id = patient_uuid;

    IF payment_method IS NULL OR payment_method = '' THEN
      payment_method := 'cash';
    ELSIF lower(payment_method) = 'insurance' THEN
      payment_method := 'insurance';
    ELSE
      payment_method := 'cash';
    END IF;
  END IF;

  IF patient_name IS NULL AND appt_uuid IS NOT NULL THEN
    SELECT patient_name INTO patient_name FROM appointments WHERE id = appt_uuid;
  END IF;

  IF patient_name IS NULL THEN
    patient_name := 'Unknown Patient';
  END IF;

  BEGIN
    SELECT COALESCE(SUM(COALESCE((item->>'cost')::numeric, 0)), 0)
    INTO total_amount
    FROM jsonb_array_elements(COALESCE(NEW.treatment_items, '[]'::jsonb)) AS item;
  EXCEPTION WHEN others THEN
    total_amount := 0;
  END;

  IF total_amount IS NULL OR total_amount <= 0 THEN
    total_amount := 30000;
  END IF;

  treatment_name := NULLIF(TRIM(COALESCE(NEW.treatment_plan, '')), '');
  IF treatment_name IS NULL THEN
    treatment_name := NULLIF(TRIM(COALESCE(NEW.diagnosis, '')), '');
  END IF;
  IF treatment_name IS NULL THEN
    treatment_name := 'General consultation';
  END IF;

  INSERT INTO payments (
    patient_id,
    patient_name,
    treatment_name,
    total_amount,
    amount_paid,
    payment_status,
    payment_method,
    insurance_provider,
    appointment_id,
    consultation_id,
    notes,
    payment_date
  ) VALUES (
    NEW.patient_id,
    patient_name,
    treatment_name,
    ROUND(total_amount)::int,
    0,
    'pending',
    payment_method,
    insurance_provider,
    appt_uuid,
    NEW.id::text,
    'Auto-created on consultation completion',
    CURRENT_DATE
  );

  RETURN NEW;
END;
$$;

-- 4) Create triggers (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_consultations_status_change') THEN
    CREATE TRIGGER trg_consultations_status_change
    AFTER UPDATE OF status ON consultations
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.sync_appointment_status_on_consultation_change();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_consultations_status_complete') THEN
    CREATE TRIGGER trg_consultations_status_complete
    AFTER UPDATE OF status ON consultations
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION public.sync_appointment_status_on_consultation_complete();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_create_payment_on_consultation_complete') THEN
    CREATE TRIGGER trg_create_payment_on_consultation_complete
    AFTER UPDATE OF status ON consultations
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION public.create_payment_on_consultation_complete();
  END IF;
END
$$;