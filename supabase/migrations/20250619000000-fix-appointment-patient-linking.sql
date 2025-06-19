-- Add patient_id field to appointments table for better linking
ALTER TABLE public.appointments 
ADD COLUMN patient_id TEXT;

-- Add index for better performance when searching by patient_id
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);

-- Add foreign key constraint to link appointments to patients table
ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE SET NULL;

-- Add trigger to update updated_at column for appointments
CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON public.appointments 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing appointments to link with patients based on patient_name
-- This will be a one-time update to populate the patient_id field
UPDATE public.appointments 
SET patient_id = (
  SELECT p.patient_id 
  FROM public.patients p 
  WHERE p.name = appointments.patient_name
  LIMIT 1
)
WHERE patient_id IS NULL;

-- Add comment to document the relationship
COMMENT ON COLUMN public.appointments.patient_id IS 'References patient_id from patients table for proper linking'; 