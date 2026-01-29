-- ============================================
-- 🪙 QUICK LOYALTY SETUP FOR ALL PRODUCTS
-- ============================================

-- Step 1: Create loyalty settings for all existing products
INSERT INTO public.loyalty_product_settings (
    product_id,
    coins_earned_per_purchase,
    coins_required_to_buy,
    is_coin_purchase_enabled,
    is_coin_earning_enabled
)
SELECT 
    p.id as product_id,
    -- Earn 1 coin per ₹10 spent (10% of price as coins)
    GREATEST(1, FLOOR(p.price * 0.10)) as coins_earned_per_purchase,
    -- Need coins worth 80% of product price to redeem
    GREATEST(10, FLOOR(p.price * 8)) as coins_required_to_buy,
    true as is_coin_purchase_enabled,
    true as is_coin_earning_enabled
FROM public.products p
LEFT JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
WHERE lps.product_id IS NULL  -- Only for products without loyalty settings
  AND p.price > 0             -- Only for products with valid price
ON CONFLICT (product_id) DO NOTHING;

-- Step 2: Show results
SELECT 
    p.name as product_name,
    p.price as product_price,
    lps.coins_earned_per_purchase,
    lps.coins_required_to_buy,
    lps.is_coin_purchase_enabled,
    lps.created_at
FROM public.products p
JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
ORDER BY lps.created_at DESC
LIMIT 10;

-- Step 3: Summary
SELECT 
    COUNT(p.id) as total_products,
    COUNT(lps.id) as products_with_loyalty,
    COUNT(p.id) - COUNT(lps.id) as products_without_loyalty
FROM public.products p
LEFT JOIN public.loyalty_product_settings lps ON p.id = lps.product_id;

-- Step 4: Enable loyalty system
UPDATE public.loyalty_system_settings 
SET is_system_enabled = true,
    default_coins_per_rupee = 0.10,
    min_coins_to_redeem = 10
WHERE id = (SELECT id FROM public.loyalty_system_settings LIMIT 1);

-- Success message
SELECT 'Loyalty system configured successfully! 🎉' as status;