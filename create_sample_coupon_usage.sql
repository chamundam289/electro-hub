-- ============================================
-- CREATE SAMPLE COUPON USAGE DATA
-- ============================================

-- First, let's check what we have
SELECT 
    au.name as affiliate_name,
    au.id as affiliate_id,
    c.coupon_code,
    c.id as coupon_id
FROM public.affiliate_users au
JOIN public.coupons c ON c.affiliate_id = au.id
WHERE au.mobile_number = 'chamundam289@gmail.com';

-- Create some sample coupon usage data
DO $$
DECLARE
    affiliate_user_id UUID;
    coupon_id_1 UUID;
    coupon_id_2 UUID;
    sample_user_id UUID;
BEGIN
    -- Get the affiliate user ID
    SELECT id INTO affiliate_user_id 
    FROM public.affiliate_users 
    WHERE mobile_number = 'chamundam289@gmail.com';
    
    -- Get the coupon IDs
    SELECT id INTO coupon_id_1 
    FROM public.coupons 
    WHERE coupon_code = 'AFF-ADMIN20' AND affiliate_id = affiliate_user_id;
    
    SELECT id INTO coupon_id_2 
    FROM public.coupons 
    WHERE coupon_code = 'AFF-WELCOME100' AND affiliate_id = affiliate_user_id;
    
    -- Get a sample user ID (or create one)
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    IF affiliate_user_id IS NOT NULL AND coupon_id_1 IS NOT NULL THEN
        -- Create sample usage records
        INSERT INTO public.coupon_usage (
            coupon_id,
            user_id,
            order_id,
            discount_amount,
            order_total,
            coins_used,
            bonus_coins_earned,
            affiliate_id,
            status,
            used_at
        ) VALUES 
        (
            coupon_id_1,
            sample_user_id,
            gen_random_uuid(), -- Sample order ID
            200.00, -- 20% of 1000
            1000.00,
            0,
            50,
            affiliate_user_id,
            'applied',
            now() - interval '2 days'
        ),
        (
            coupon_id_2,
            sample_user_id,
            gen_random_uuid(), -- Sample order ID
            100.00, -- Flat discount
            750.00,
            0,
            25,
            affiliate_user_id,
            'applied',
            now() - interval '1 day'
        ),
        (
            coupon_id_1,
            sample_user_id,
            gen_random_uuid(), -- Sample order ID
            150.00, -- 20% of 750
            750.00,
            0,
            50,
            affiliate_user_id,
            'applied',
            now() - interval '3 hours'
        ) ON CONFLICT DO NOTHING;
        
        -- Update coupon statistics
        UPDATE public.coupons 
        SET 
            total_usage_count = 2,
            total_discount_given = 350.00,
            total_revenue_generated = 1400.00
        WHERE id = coupon_id_1;
        
        UPDATE public.coupons 
        SET 
            total_usage_count = 1,
            total_discount_given = 100.00,
            total_revenue_generated = 650.00
        WHERE id = coupon_id_2;
        
        RAISE NOTICE 'Created sample coupon usage data';
    ELSE
        RAISE NOTICE 'Could not find affiliate user or coupons';
    END IF;
END $$;

-- Verify the sample data
SELECT 
    c.coupon_code,
    c.coupon_title,
    c.total_usage_count,
    c.total_discount_given,
    COUNT(cu.id) as actual_usage_count
FROM public.coupons c
LEFT JOIN public.coupon_usage cu ON cu.coupon_id = c.id
WHERE c.affiliate_id = (
    SELECT id FROM public.affiliate_users WHERE mobile_number = 'chamundam289@gmail.com'
)
GROUP BY c.id, c.coupon_code, c.coupon_title, c.total_usage_count, c.total_discount_given;