-- Fix patients -> appointments sync function (type mismatch text vs uuid)
CREATE OR REPLACE FUNCTION public.sync_appointment_insurance_from_patient()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  patient_uuid TEXT;
BEGIN
  -- Only sync if appointment has insurance and NEW.insurance present
  IF NEW.insurance IS NOT NULL AND NEW.insurance != '' THEN
    -- Ensure we compare using text, appointments.patient_id is TEXT
    patient_uuid := NEW.id::text;

    UPDATE appointments 
    SET 
      insurance = NEW.insurance,
      patient_type = 'insurance'
    WHERE patient_id = patient_uuid;
  END IF;
  
  RETURN NEW;
END;
$function$;