-- Add missing columns to transactions table to support new booking features

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS meeting_point TEXT;

-- Refresh schema cache (usually happens automatically, but good to know)
NOTIFY pgrst, 'reload schema';
