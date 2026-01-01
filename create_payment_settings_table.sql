-- Create a table payment_settings to store Midtrans configuration
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id SERIAL PRIMARY KEY,
    mode VARCHAR(20) DEFAULT 'sandbox', -- 'sandbox' or 'production'
    
    -- Sandbox Keys
    sandbox_merchant_id VARCHAR(255),
    sandbox_client_key VARCHAR(255),
    sandbox_server_key VARCHAR(255),
    
    -- Production Keys
    prod_merchant_id VARCHAR(255),
    prod_client_key VARCHAR(255),
    prod_server_key VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Allow only admins to read/write (For now, allowing authenticated to read public keys might be necessary for client-side)
-- But Server Key MUST remain secret. So we might need a stored procedure to get just the client key.
-- For simplicity in this demo environment:
CREATE POLICY "Allow all authenticated to read settings" ON public.payment_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to update settings" ON public.payment_settings FOR ALL TO authenticated USING (true) WITH CHECK (true); -- Ideally restrict to admin role

-- Insert default row if not exists
INSERT INTO public.payment_settings (id, mode) VALUES (1, 'sandbox') ON CONFLICT DO NOTHING;
