
-- Create payments table to track manual payment collection
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  treatment_name TEXT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  consultation_id TEXT,
  total_amount INTEGER NOT NULL DEFAULT 0, -- Amount in cents
  amount_paid INTEGER NOT NULL DEFAULT 0, -- Amount paid in cents
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'insurance')),
  insurance_provider TEXT,
  collected_by TEXT,
  payment_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
CREATE POLICY "Allow all operations on payments" 
  ON public.payments 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create payment_items table for itemized billing
CREATE TABLE public.payment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0, -- Price in cents
  total_price INTEGER GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security for payment_items
ALTER TABLE public.payment_items ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_items table
CREATE POLICY "Allow all operations on payment_items" 
  ON public.payment_items 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON public.payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
