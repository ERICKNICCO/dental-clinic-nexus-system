
-- Create missing tables and update existing ones for complete Supabase migration

-- Add patient_id column to appointments table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'patient_id') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
    END IF;
END $$;

-- Create inventory table for inventory management
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  supplier TEXT,
  brand TEXT,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_movements table for inventory tracking
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'stock_take')),
  quantity INTEGER NOT NULL,
  remaining_stock INTEGER NOT NULL,
  performed_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  supplier TEXT,
  brand TEXT,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create treatment_pricing table for treatment pricing management
CREATE TABLE IF NOT EXISTS public.treatment_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price INTEGER NOT NULL DEFAULT 0, -- Price in cents
  duration INTEGER NOT NULL DEFAULT 30, -- Duration in minutes
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for new tables
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_pricing ENABLE ROW LEVEL SECURITY;

-- Policies for inventory
CREATE POLICY "Allow all operations on inventory" ON public.inventory FOR ALL USING (true);
CREATE POLICY "Allow all operations on stock_movements" ON public.stock_movements FOR ALL USING (true);
CREATE POLICY "Allow all operations on treatment_pricing" ON public.treatment_pricing FOR ALL USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_inventory_updated_at 
  BEFORE UPDATE ON public.inventory 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_pricing_updated_at 
  BEFORE UPDATE ON public.treatment_pricing 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_name ON public.inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id ON public.stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_treatment_pricing_category ON public.treatment_pricing(category);
