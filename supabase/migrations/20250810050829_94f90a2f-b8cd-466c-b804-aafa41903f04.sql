-- SMART integration schema updates
-- 1) Store SMART item_code per treatment
ALTER TABLE public.treatment_pricing
ADD COLUMN IF NOT EXISTS smart_item_code TEXT;

-- Helpful index for mapping during claim building
CREATE INDEX IF NOT EXISTS idx_treatment_pricing_smart_item_code
  ON public.treatment_pricing (smart_item_code);

-- 2) Store SMART patientNumber returned/used by SMART visit/session APIs
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS smart_patient_number TEXT;