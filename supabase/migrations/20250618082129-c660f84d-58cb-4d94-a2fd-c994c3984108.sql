
-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth TEXT NOT NULL,
  gender TEXT NOT NULL,
  address TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  emergency_phone TEXT NOT NULL,
  insurance TEXT,
  patient_type TEXT NOT NULL CHECK (patient_type IN ('insurance', 'cash')),
  last_visit TEXT,
  next_appointment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_patients_patient_id ON public.patients(patient_id);
CREATE INDEX idx_patients_name ON public.patients(name);
CREATE INDEX idx_patients_email ON public.patients(email);

-- Add trigger to update updated_at column
CREATE TRIGGER update_patients_updated_at 
  BEFORE UPDATE ON public.patients 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (if needed for future authentication)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can add more restrictive policies later)
CREATE POLICY "Allow all operations on patients" ON public.patients
  FOR ALL USING (true);
