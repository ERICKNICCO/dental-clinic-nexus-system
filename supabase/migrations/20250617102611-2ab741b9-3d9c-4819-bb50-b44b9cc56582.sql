
-- Create consultations table in Supabase
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  appointment_id TEXT,
  status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'waiting-xray', 'xray-done', 'completed', 'cancelled')),
  
  -- Consultation steps
  symptoms TEXT DEFAULT '',
  examination TEXT DEFAULT '',
  vital_signs JSONB DEFAULT '{}',
  diagnosis TEXT DEFAULT '',
  diagnosis_type TEXT DEFAULT 'clinical' CHECK (diagnosis_type IN ('clinical', 'xray')),
  treatment_plan TEXT DEFAULT '',
  prescriptions TEXT DEFAULT '',
  follow_up_instructions TEXT DEFAULT '',
  next_appointment TEXT,
  
  -- Treatment cost information
  estimated_cost DECIMAL(10,2),
  treatment_items JSONB DEFAULT '[]',
  
  -- X-ray result
  xray_result JSONB,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Policy to allow doctors to view all consultations
CREATE POLICY "Doctors can view all consultations" 
  ON public.consultations 
  FOR SELECT 
  USING (true);

-- Policy to allow doctors to create consultations
CREATE POLICY "Doctors can create consultations" 
  ON public.consultations 
  FOR INSERT 
  WITH CHECK (true);

-- Policy to allow doctors to update consultations
CREATE POLICY "Doctors can update consultations" 
  ON public.consultations 
  FOR UPDATE 
  USING (true);

-- Policy to allow doctors to delete consultations
CREATE POLICY "Doctors can delete consultations" 
  ON public.consultations 
  FOR DELETE 
  USING (true);

-- Add trigger to update updated_at column
CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
