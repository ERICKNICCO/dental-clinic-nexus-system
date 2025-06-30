
-- Add insurance_provider column to treatment_pricing table to support different pricing tiers
ALTER TABLE treatment_pricing ADD COLUMN insurance_provider text DEFAULT 'cash';

-- Create unique constraint to prevent duplicate entries for same treatment and insurance provider
ALTER TABLE treatment_pricing ADD CONSTRAINT unique_treatment_insurance 
UNIQUE (name, category, insurance_provider);

-- Update existing records to be 'cash' type
UPDATE treatment_pricing SET insurance_provider = 'cash' WHERE insurance_provider IS NULL;

-- Add index for better performance when querying by insurance provider
CREATE INDEX idx_treatment_pricing_insurance ON treatment_pricing(insurance_provider);

-- Create a view to easily see all pricing variants for treatments
CREATE OR REPLACE VIEW treatment_pricing_overview AS
SELECT 
    name,
    category,
    insurance_provider,
    base_price,
    duration,
    description,
    is_active,
    created_at,
    updated_at
FROM treatment_pricing
ORDER BY name, insurance_provider;
