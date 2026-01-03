-- FIX: Add missing 'date' column to 'transactions' table
-- This column is required for storing the booking date (Trip date, Check-in date, or Transport start date)

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS date DATE;

-- OPTIONAL: If the app expects it to be text instead of date type (some frontends do this)
-- But usually DATE is better for sorting. Let's use DATE as it's standard for 'date' columns.

-- REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN public.transactions.date IS 'Stores the specific date of the service (e.g., Trip Start Date, Check-in Date)';
