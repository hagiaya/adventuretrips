-- Comprehensive Schema Update
-- Run this to ensure all necessary columns exist

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Optional: Add trigger to auto-update 'updated_at'
-- CREATE OR REPLACE FUNCTION update_modified_column() 
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW.updated_at = now();
--    RETURN NEW;   
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_customer_modtime BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
