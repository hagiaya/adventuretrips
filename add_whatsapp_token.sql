ALTER TABLE public.payment_settings ADD COLUMN IF NOT EXISTS whatsapp_token VARCHAR(255);
NOTIFY pgrst, 'reload schema';
