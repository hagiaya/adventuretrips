
-- 1. Create trip_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trip_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE,
    duration INTEGER, -- in days
    pax INTEGER, -- number of participants
    budget_min NUMERIC,
    budget_max NUMERIC,
    special_requests TEXT,
    status TEXT DEFAULT 'pending', -- pending, contacted, deal, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add pickup_point column to trip_requests if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_requests' AND column_name = 'pickup_point') THEN
        ALTER TABLE public.trip_requests ADD COLUMN pickup_point TEXT;
    END IF;
END $$;

-- 3. Enable RLS on trip_requests
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

-- 4. Policies for trip_requests (Drop first to avoid errors if they exist)
DROP POLICY IF EXISTS "Admins can view all requests" ON public.trip_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON public.trip_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON public.trip_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.trip_requests;

CREATE POLICY "Admins can view all requests" ON public.trip_requests
    FOR SELECT USING (
        exists(select 1 from public.users where id = auth.uid() and role in ('admin', 'superadmin'))
    );

CREATE POLICY "Admins can update requests" ON public.trip_requests
    FOR UPDATE USING (
        exists(select 1 from public.users where id = auth.uid() and role in ('admin', 'superadmin'))
    );

CREATE POLICY "Users can insert own requests" ON public.trip_requests
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

CREATE POLICY "Users can view own requests" ON public.trip_requests
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- 5. Add KYC columns to profiles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_status') THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_status TEXT DEFAULT 'unverified'; -- unverified, pending, verified, rejected
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_full_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_id_number') THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_id_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_id_image') THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_id_image TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_selfie_image') THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_selfie_image TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_rejected_reason') THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_rejected_reason TEXT;
    END IF;
END $$;
