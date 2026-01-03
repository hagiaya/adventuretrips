-- 1. Create table if likely missing (idempotent)
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Force Enable RLS
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies to clean conflicts
DROP POLICY IF EXISTS "Public Read Payment Settings" ON payment_settings;
DROP POLICY IF EXISTS "Admin All Payment Settings" ON payment_settings;
DROP POLICY IF EXISTS "Anyone All Payment Settings" ON payment_settings;

-- 4. Create correct policies for payment_settings
-- Public Read (for checkout page)
CREATE POLICY "Public Read Payment Settings"
ON payment_settings FOR SELECT
TO public
USING (true);

-- Authenticated (Admin) ALL Permissions
CREATE POLICY "Admin All Payment Settings"
ON payment_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert default row if empty to avoid 406 on select single
INSERT INTO payment_settings (settings)
SELECT '{"tax_rate": 0, "service_fee": 0}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM payment_settings);
