-- 1. Ensure columns exist in products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0;

-- 2. Create function to calculate average rating and count
CREATE OR REPLACE FUNCTION public.handle_review_change()
RETURNS TRIGGER AS $$
DECLARE
    target_product_id uuid;
    new_avg numeric;
    new_count integer;
BEGIN
    -- Determine the product_id based on the operation
    IF (TG_OP = 'DELETE') THEN
        target_product_id := OLD.product_id;
    ELSE
        target_product_id := NEW.product_id;
    END IF;

    -- Calculate new stats
    SELECT 
        COALESCE(AVG(rating), 0), 
        COUNT(*)
    INTO 
        new_avg, 
        new_count
    FROM public.reviews 
    WHERE product_id = target_product_id;

    -- Update the products table
    UPDATE public.products
    SET 
        rating = ROUND(new_avg, 1), -- Round to 1 decimal place
        reviews_count = new_count
    WHERE id = target_product_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger to fire on any change in reviews
DROP TRIGGER IF EXISTS on_review_change ON public.reviews;

CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_review_change();
