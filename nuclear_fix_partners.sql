-- DISABLE Row Level Security on the partners table to unblock saving
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to everyone (just to be safe)
GRANT ALL ON partners TO postgres;
GRANT ALL ON partners TO anon;
GRANT ALL ON partners TO authenticated;
GRANT ALL ON partners TO service_role;
