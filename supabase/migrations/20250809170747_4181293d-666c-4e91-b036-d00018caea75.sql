-- Create function to auto-create a payment when a consultation is completed
CREATE OR REPLACE FUNCTION public.create_payment_on_consultation_complete()
RETURNS trigger
LANGUAGE plpgsql
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
  -- Only proceed when status changes to completed
  IF NOT (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN
    RETURN NEW;
  END IF;

  -- Avoid duplicates
  SELECT COUNT(*) INTO existing_count FROM payments WHERE consultation_id = NEW.id::text;
  IF existing_count > 0 THEN
    RETURN NEW;
  END IF;

  -- Safe cast appointment_id
  BEGIN
    appt_uuid := NEW.appointment_id::uuid;
  EXCEPTION WHEN others THEN
    appt_uuid := NULL;
  END;

  -- Safe cast patient_id
  BEGIN
    patient_uuid := NEW.patient_id::uuid;
  EXCEPTION WHEN others THEN
    patient_uuid := NULL;
  END;

  -- Resolve patient_name from patients or appointments
  IF patient_uuid IS NOT NULL THEN
    SELECT name, patient_type, insurance INTO patient_name, payment_method, insurance_provider
    FROM patients
    WHERE id = patient_uuid;

    -- Normalize payment_method
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

  -- Fallback if still null
  IF patient_name IS NULL THEN
    patient_name := 'Unknown Patient';
  END IF;

  -- Compute total from treatment_items JSONB
  BEGIN
    SELECT COALESCE(SUM(COALESCE((item->>'cost')::numeric, 0)), 0)
    INTO total_amount
    FROM jsonb_array_elements(COALESCE(NEW.treatment_items, '[]'::jsonb)) AS item;
  EXCEPTION WHEN others THEN
    total_amount := 0;
  END;

  -- Fallback minimum (e.g., consultation fee)
  IF total_amount IS NULL OR total_amount <= 0 THEN
    total_amount := 30000; -- default consultation fee
  END IF;

  -- Determine treatment_name (prefer concise plan, else diagnosis)
  treatment_name := NULLIF(TRIM(COALESCE(NEW.treatment_plan, '')), '');
  IF treatment_name IS NULL THEN
    treatment_name := NULLIF(TRIM(COALESCE(NEW.diagnosis, '')), '');
  END IF;
  IF treatment_name IS NULL THEN
    treatment_name := 'General consultation';
  END IF;

  -- Insert payment
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

-- Create trigger on consultations
DROP TRIGGER IF EXISTS trg_create_payment_on_consultation_complete ON public.consultations;
CREATE TRIGGER trg_create_payment_on_consultation_complete
AFTER UPDATE ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.create_payment_on_consultation_complete();
