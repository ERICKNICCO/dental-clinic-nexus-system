-- Set explicit search_path for functions we just updated for security and predictability
CREATE OR REPLACE FUNCTION public.sync_appointment_status_on_consultation_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  appt_uuid uuid;
BEGIN
  BEGIN
    appt_uuid := NEW.appointment_id::uuid;
  EXCEPTION WHEN others THEN
    appt_uuid := NULL;
  END;

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
SET search_path TO public
AS $$
DECLARE
  appt_uuid uuid;
BEGIN
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

CREATE OR REPLACE FUNCTION public.update_consultation_status(consultation_id uuid, new_status text, completed_at timestamp with time zone DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE consultations 
  SET 
    status = new_status,
    completed_at = COALESCE(completed_at, CASE WHEN new_status = 'completed' THEN now() ELSE consultations.completed_at END),
    updated_at = now()
  WHERE id = consultation_id::uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation with ID % not found', consultation_id;
  END IF;
END;
$$;