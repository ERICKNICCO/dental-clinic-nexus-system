-- Harden the new trigger function by setting an explicit search_path
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