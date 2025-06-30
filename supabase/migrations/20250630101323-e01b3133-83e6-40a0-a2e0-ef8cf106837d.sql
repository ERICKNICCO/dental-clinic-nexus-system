
-- Create insurance_claims table
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  consultation_id TEXT,
  appointment_id UUID,
  insurance_provider TEXT NOT NULL,
  claim_number TEXT,
  treatment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  patient_signature TEXT NOT NULL, -- Base64 encoded signature
  claim_status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for insurance_claims
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

-- Create policies for insurance_claims
CREATE POLICY "All users can view insurance claims" ON public.insurance_claims FOR SELECT USING (true);
CREATE POLICY "All users can create insurance claims" ON public.insurance_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "All users can update insurance claims" ON public.insurance_claims FOR UPDATE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_insurance_claims_updated_at
  BEFORE UPDATE ON public.insurance_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
