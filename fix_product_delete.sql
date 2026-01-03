-- Add is_deleted column to products table for Soft Delete
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_deleted') THEN
        ALTER TABLE public.products ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create index on is_deleted for performance
CREATE INDEX IF NOT EXISTS products_is_deleted_idx ON public.products (is_deleted);
