
-- Create a table for Private Trip / Custom Trip Requests
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

-- Enable RLS
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can view all
CREATE POLICY "Admins can view all requests" ON public.trip_requests
    FOR SELECT USING (
        exists(select 1 from public.users where id = auth.uid() and role in ('admin', 'superadmin'))
    );

-- Admin can update
CREATE POLICY "Admins can update requests" ON public.trip_requests
    FOR UPDATE USING (
        exists(select 1 from public.users where id = auth.uid() and role in ('admin', 'superadmin'))
    );

-- Customers can insert their own requests
CREATE POLICY "Users can insert own requests" ON public.trip_requests
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL -- Allow anon insertions if we support it (or if user_id optional)
    );

-- Customers can view their own requests
CREATE POLICY "Users can view own requests" ON public.trip_requests
    FOR SELECT USING (
        auth.uid() = user_id
    );
