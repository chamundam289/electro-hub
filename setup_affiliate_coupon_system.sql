-- ============================================
-- SETUP AFFILIATE COUPON SYSTEM
-- ============================================

-- Fix affiliate table permissions
ALTER TABLE public.affiliate_users DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.affiliate_users TO authenticated, anon;

-- Create affiliate user for the admin email
INSERT INTO public.affiliate_users (
    name,
    mobile_number,
    password_hash,
    affiliate_code,
    is_active,
    total_clicks,
    total_orders,
    total_earnings,
    pending_commission,
    paid_commission,
    created_at
) VALUES (
    'Admin Affiliate',
    'chamundam289@gmail.com',
    'dummy_hash_not_used_for_login',
    'ADMIN001',
    true,
    0,
    0,
    0.00,
    0.00,
    0.00,
    now()
) ON CONFLICT (mobile_number) DO UPDATE SET
    name = EXCLUDED.name,
    affiliate_code = EXCLUDED.affiliate_code,
    is_active = EXCLUDED.is_active;

-- Get the affiliate user ID for creating sample coupons
DO $$
DECLARE
    affiliate_user_id UUID;
BEGIN
    -- Get the affiliate user ID
    SELECT id INTO affiliate_user_id 
    FROM public.affiliate_users 
    WHERE mobile_number = 'chamundam289@gmail.com';
    
    -- Create sample affiliate-specific coupons
    IF affiliate_user_id IS NOT NULL THEN
        INSERT INTO public.coupons (
            coupon_code,
            coupon_title,
            description,
            discount_type,
            discount_value,
            min_order_value,
            is_affiliate_specific,
            affiliate_id,
            coins_integration_type,
            bonus_coins_earned,
            start_date,
            end_date,
            per_user_usage_limit,
            is_active
        ) VALUES 
        (
            'AFF-ADMIN20',
            'Admin Affiliate Special',
            'Exclusive 20% discount for admin affiliate customers',
            'percentage',
            20.00,
            1000.00,
            true,
            affiliate_user_id,
            'earn_extra',
            50,
            now(),
            now() + interval '30 days',
            5,
            true
        ),
        (
            'AFF-WELCOME100',
            'Affiliate Welcome Bonus',
            'Special ₹100 off for new customers via affiliate link',
            'flat',
            100.00,
            500.00,
            true,
            affiliate_user_id,
            'earn_extra',
            25,
            now(),
            now() + interval '60 days',
            1,
            true
        ) ON CONFLICT (coupon_code) DO NOTHING;
        
        RAISE NOTICE 'Created affiliate coupons for user ID: %', affiliate_user_id;
    ELSE
        RAISE NOTICE 'Affiliate user not found';
    END IF;
END $$;

-- Verify the setup
SELECT 
    au.name,
    au.mobile_number,
    au.affiliate_code,
    COUNT(c.id) as coupon_count
FROM public.affiliate_users au
LEFT JOIN public.coupons c ON c.affiliate_id = au.id
WHERE au.mobile_number = 'chamundam289@gmail.com'
GROUP BY au.id, au.name, au.mobile_number, au.affiliate_code;