-- Add balance column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS balance DECIMAL(20, 2) DEFAULT 0;

-- Optional: Add a transaction history table for balance changes if needed in the future
CREATE TABLE IF NOT EXISTS balance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(20, 2) NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
