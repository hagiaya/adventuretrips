-- Add transaction details columns to withdrawals table
ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS transaction_number TEXT,
ADD COLUMN IF NOT EXISTS proof_image TEXT;
