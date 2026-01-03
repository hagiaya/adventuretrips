-- 1. Check if column exists, if not add it.
-- We do this by trying to add it and ignoring error, or better, strictly altering.
-- But standard SQL doesn't have "ADD COLUMN IF NOT EXISTS" easily in all postgres versions without a block.
-- Let's just drop and recreate nicely or alter.

-- Option A: Safe Alter
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_settings' AND column_name='settings') THEN
        ALTER TABLE payment_settings ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
END $$;

-- 2. Force permissions again just in case
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies to clean conflicts
DROP POLICY IF EXISTS "Public Read Payment Settings" ON payment_settings;
DROP POLICY IF EXISTS "Admin All Payment Settings" ON payment_settings;

-- 4. Create correct policies for payment_settings
-- Public Read
CREATE POLICY "Public Read Payment Settings"
ON payment_settings FOR SELECT
TO public
USING (true);

-- Admin All
CREATE POLICY "Admin All Payment Settings"
ON payment_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Insert default row if empty
INSERT INTO payment_settings (settings)
SELECT '{"tax_rate": 0, "service_fee": 0}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM payment_settings);
