-- Add tax_percentage to payment_settings
ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC DEFAULT 0;

-- Add discount_percentage to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;

-- Optional: Ensure original_price is definitely in features or add it as column if needed
-- We already have features->>'original_price', but a dedicated column might be easier for querying/sorting
-- letting features handle it for now as per previous instructions, but discount_percentage is core enough for a column or just keep it consistent.
-- Let's put discount_percentage as a column for easier access.
