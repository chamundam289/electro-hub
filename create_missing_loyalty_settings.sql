-- ============================================
-- CREATE MISSING LOYALTY SETTINGS FOR PRODUCTS
-- ============================================

-- This script creates loyalty settings for products that don't have them yet
-- It uses the coin values from the products table if they exist, otherwise uses defaults

INSERT INTO public.loyalty_product_settings (
    product_id,
    coins_earned_per_purchase,
    coins_required_to_buy,
    is_coin_purchase_enabled,
    is_coin_earning_enabled,
    created_at,
    updated_at
)
SELECT 
    p.id as product_id,
    COALESCE(p.coins_earned_per_purchase, FLOOR(p.price * 0.05)) as coins_earned_per_purchase,
    COALESCE(p.coins_required_to_buy, FLOOR(p.price * 0.8)) as coins_required_to_buy,
    COALESCE(p.is_coin_purchase_enabled, true) as is_coin_purchase_enabled,
    CASE 
        WHEN COALESCE(p.coins_earned_per_purchase, FLOOR(p.price * 0.05)) > 0 THEN true 
        ELSE false 
    END as is_coin_earning_enabled,
    NOW() as created_at,
    NOW() as updated_at
FROM public.products p
LEFT JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
WHERE lps.product_id IS NULL  -- Only for products without loyalty settings
  AND p.price > 0             -- Only for products with valid price
ON CONFLICT (product_id) DO NOTHING;

-- Show results
SELECT 
    p.name as product_name,
    p.price,
    lps.coins_earned_per_purchase,
    lps.coins_required_to_buy,
    lps.is_coin_purchase_enabled,
    lps.is_coin_earning_enabled,
    lps.created_at
FROM public.products p
JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
ORDER BY lps.created_at DESC
LIMIT 10;

-- Summary
SELECT 
    COUNT(*) as total_products,
    COUNT(lps.id) as products_with_loyalty_settings,
    COUNT(*) - COUNT(lps.id) as products_without_loyalty_settings
FROM public.products p
LEFT JOIN public.loyalty_product_settings lps ON p.id = lps.product_id;