-- Add kyc_bank_account column to profiles table to store user's bank account number for KYC
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS kyc_bank_account TEXT;

-- Optional: Add a comment to the column
COMMENT ON COLUMN public.profiles.kyc_bank_account IS 'User bank account number for withdrawals';
