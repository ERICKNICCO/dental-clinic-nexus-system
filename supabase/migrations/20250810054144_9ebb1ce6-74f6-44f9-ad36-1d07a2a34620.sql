-- Fix: appointments column name is patienttype (not patient_type)
CREATE OR REPLACE FUNCTION public.sync_appointment_insurance_from_patient()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.insurance IS NOT NULL AND NEW.insurance != '' THEN
    UPDATE appointments 
    SET 
      insurance = NEW.insurance,
      patienttype = 'insurance'
    WHERE patient_id = NEW.id::text;
  END IF;
  RETURN NEW;
END;
$function$;