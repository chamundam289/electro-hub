-- Fix coupon relationships and add sample product coupon settings

-- First, let's add foreign key constraint for coupon_usage -> coupons if it doesn't exist
DO $$ 
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_coupon_usage_coupon' 
        AND table_name = 'coupon_usage'
    ) THEN
        ALTER TABLE public.coupon_usage 
        ADD CONSTRAINT fk_coupon_usage_coupon 
        FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add sample product coupon settings for existing products
INSERT INTO public.product_coupon_settings (
    product_id, 
    is_coupon_eligible, 
    max_coupon_discount, 
    coupon_categories, 
    allow_coupon_stacking
)
SELECT 
    p.id as product_id,
    true as is_coupon_eligible,
    CASE 
        WHEN p.price > 20000 THEN 30  -- Premium products: max 30% discount
        WHEN p.price > 10000 THEN 50  -- Mid-range products: max 50% discount
        ELSE 70                       -- Budget products: max 70% discount
    END as max_coupon_discount,
    CASE 
        WHEN p.price > 20000 THEN 'premium,electronics,luxury'
        WHEN p.price > 10000 THEN 'electronics,gadgets,popular'
        ELSE 'budget,electronics,general'
    END as coupon_categories,
    true as allow_coupon_stacking
FROM public.products p
WHERE NOT EXISTS (
    SELECT 1 FROM public.product_coupon_settings pcs 
    WHERE pcs.product_id = p.id
)
LIMIT 10;

-- Create some sample coupon usage records for testing
INSERT INTO public.coupon_usage (
    coupon_id,
    user_id,
    order_id,
    discount_amount,
    order_total,
    status,
    used_at
)
SELECT 
    c.id as coupon_id,
    (SELECT id FROM auth.users LIMIT 1) as user_id,
    gen_random_uuid() as order_id,
    CASE 
        WHEN c.discount_type = 'flat' THEN c.discount_value
        ELSE (1000 * c.discount_value / 100) -- Assume ₹1000 order for percentage
    END as discount_amount,
    1000 as order_total,
    'applied' as status,
    now() - (random() * interval '30 days') as used_at
FROM public.coupons c
WHERE c.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM public.coupon_usage cu WHERE cu.coupon_id = c.id
)
LIMIT 3
ON CONFLICT DO NOTHING;

-- Update coupon usage counts
UPDATE public.coupons 
SET total_usage_count = (
    SELECT COUNT(*) FROM public.coupon_usage 
    WHERE coupon_usage.coupon_id = coupons.id
),
total_discount_given = (
    SELECT COALESCE(SUM(discount_amount), 0) FROM public.coupon_usage 
    WHERE coupon_usage.coupon_id = coupons.id
);

-- Add some sample user-specific coupons
INSERT INTO public.user_coupons (
    user_id,
    coupon_id,
    assignment_reason,
    assigned_at
)
SELECT 
    u.id as user_id,
    c.id as coupon_id,
    'Welcome bonus for new user' as assignment_reason,
    now() as assigned_at
FROM auth.users u
CROSS JOIN public.coupons c
WHERE c.coupon_code = 'WELCOME50'
AND NOT EXISTS (
    SELECT 1 FROM public.user_coupons uc 
    WHERE uc.user_id = u.id AND uc.coupon_id = c.id
)
LIMIT 5
ON CONFLICT DO NOTHING;