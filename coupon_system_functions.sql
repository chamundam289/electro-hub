-- ============================================
-- COUPON SYSTEM FUNCTIONS
-- ============================================

-- Function to generate unique coupon code
CREATE OR REPLACE FUNCTION generate_coupon_code(prefix TEXT DEFAULT 'SAVE')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    code TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        code := prefix || LPAD(floor(random() * 999999)::TEXT, 6, '0');
        SELECT COUNT(*) INTO exists_check FROM public.coupons WHERE coupon_code = code;
        EXIT WHEN exists_check = 0;
    END LOOP;
    RETURN code;
END;
$$;

-- Function to calculate discount amount
CREATE OR REPLACE FUNCTION calculate_coupon_discount(
    discount_type TEXT,
    discount_value DECIMAL,
    order_total DECIMAL,
    max_discount_amount DECIMAL DEFAULT NULL
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
    discount_amount DECIMAL(10,2);
BEGIN
    IF discount_type = 'flat' THEN
        discount_amount := LEAST(discount_value, order_total);
    ELSE -- percentage
        discount_amount := (order_total * discount_value) / 100;
        IF max_discount_amount IS NOT NULL THEN
            discount_amount := LEAST(discount_amount, max_discount_amount);
        END IF;
    END IF;
    
    RETURN discount_amount;
END;
$$;

-- Function to check if user can use coupon
CREATE OR REPLACE FUNCTION can_user_use_coupon(
    coupon_id UUID,
    user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    coupon_record RECORD;
    user_usage_count INTEGER;
    daily_usage_count INTEGER;
BEGIN
    -- Get coupon details
    SELECT * INTO coupon_record 
    FROM public.coupons 
    WHERE id = coupon_id AND is_active = true;
    
    -- Check if coupon exists and is active
    IF coupon_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check expiry dates
    IF coupon_record.start_date > now() THEN
        RETURN false;
    END IF;
    
    IF coupon_record.end_date IS NOT NULL AND coupon_record.end_date < now() THEN
        RETURN false;
    END IF;
    
    -- Check user usage limit
    SELECT COUNT(*) INTO user_usage_count
    FROM public.coupon_usage
    WHERE coupon_id = coupon_record.id AND user_id = user_id AND status = 'applied';
    
    IF user_usage_count >= coupon_record.per_user_usage_limit THEN
        RETURN false;
    END IF;
    
    -- Check total usage limit
    IF coupon_record.total_usage_limit IS NOT NULL AND 
       coupon_record.total_usage_count >= coupon_record.total_usage_limit THEN
        RETURN false;
    END IF;
    
    -- Check daily usage limit
    IF coupon_record.daily_usage_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO daily_usage_count
        FROM public.coupon_usage
        WHERE coupon_id = coupon_record.id 
        AND DATE(used_at) = CURRENT_DATE 
        AND status = 'applied';
        
        IF daily_usage_count >= coupon_record.daily_usage_limit THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$;

-- Function to update coupon statistics
CREATE OR REPLACE FUNCTION update_coupon_stats(
    coupon_id UUID,
    discount_amount DECIMAL,
    order_total DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.coupons 
    SET 
        total_usage_count = total_usage_count + 1,
        total_discount_given = total_discount_given + discount_amount,
        total_revenue_generated = total_revenue_generated + (order_total - discount_amount),
        updated_at = now()
    WHERE id = coupon_id;
END;
$$;