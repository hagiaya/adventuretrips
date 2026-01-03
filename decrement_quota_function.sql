
-- Improved Function to decrement product quota
-- compares date as string to avoid strict casting mismatches
CREATE OR REPLACE FUNCTION decrement_product_quota(
    p_product_id UUID,
    p_date DATE,
    p_quantity INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_schedules JSONB;
    v_new_schedules JSONB;
BEGIN
    -- Get current schedules
    SELECT schedules INTO v_schedules
    FROM public.products
    WHERE id = p_product_id;

    IF v_schedules IS NULL OR jsonb_array_length(v_schedules) = 0 THEN
        RETURN;
    END IF;

    -- Update the specific array element
    SELECT jsonb_agg(
        CASE
            -- Compare date as YYYY-MM-DD string to match JSON content
            WHEN (elem->>'date') = to_char(p_date, 'YYYY-MM-DD') THEN
                jsonb_set(
                    elem,
                    '{booked}',
                    to_jsonb(COALESCE((elem->>'booked')::INTEGER, 0) + p_quantity)
                )
            ELSE elem
        END
    ) INTO v_new_schedules
    FROM jsonb_array_elements(v_schedules) AS elem;

    -- Update the product table if changes were made
    UPDATE public.products
    SET schedules = v_new_schedules
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
