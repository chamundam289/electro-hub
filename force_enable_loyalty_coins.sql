-- ============================================
-- 🪙 FORCE ENABLE LOYALTY COINS DISPLAY
-- ============================================
-- यह script loyalty coins को force enable करेगा

-- Step 1: Enable loyalty system
INSERT INTO public.loyalty_system_settings (
    is_system_enabled,
    global_coins_multiplier,
    default_coins_per_rupee,
    min_coins_to_redeem,
    festive_multiplier
) VALUES (
    true,
    1.00,
    0.10,
    10,
    1.00
) ON CONFLICT DO NOTHING;

-- If already exists, update to enable
UPDATE public.loyalty_system_settings 
SET is_system_enabled = true,
    default_coins_per_rupee = 0.10,
    min_coins_to_redeem = 10
WHERE id = (SELECT id FROM public.loyalty_system_settings LIMIT 1);

-- Step 2: Create loyalty settings for ALL products
INSERT INTO public.loyalty_product_settings (
    product_id,
    coins_earned_per_purchase,
    coins_required_to_buy,
    is_coin_purchase_enabled,
    is_coin_earning_enabled
)
SELECT 
    p.id as product_id,
    GREATEST(5, FLOOR(p.price * 0.1)) as coins_earned_per_purchase,  -- At least 5 coins, or 10% of price
    GREATEST(50, FLOOR(p.price * 5)) as coins_required_to_buy,       -- At least 50 coins, or 5x price
    true as is_coin_purchase_enabled,
    true as is_coin_earning_enabled
FROM public.products p
WHERE NOT EXISTS (
    SELECT 1 FROM public.loyalty_product_settings lps 
    WHERE lps.product_id = p.id
)
AND p.price > 0;

-- Step 3: Update existing loyalty settings to be more visible
UPDATE public.loyalty_product_settings 
SET coins_earned_per_purchase = GREATEST(5, coins_earned_per_purchase),
    coins_required_to_buy = GREATEST(50, coins_required_to_buy),
    is_coin_purchase_enabled = true,
    is_coin_earning_enabled = true
WHERE coins_earned_per_purchase < 5 OR coins_required_to_buy < 50;

-- Step 4: Verify the setup
SELECT 'Loyalty System Status' as check_type,
       CASE WHEN is_system_enabled THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM public.loyalty_system_settings 
LIMIT 1;

-- Step 5: Show products with loyalty settings
SELECT 
    p.name as product_name,
    p.price as product_price,
    lps.coins_earned_per_purchase as earn_coins,
    lps.coins_required_to_buy as redeem_coins,
    lps.is_coin_purchase_enabled as can_redeem,
    lps.is_coin_earning_enabled as can_earn
FROM public.products p
JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
ORDER BY p.name
LIMIT 10;

-- Step 6: Count products with loyalty settings
SELECT 
    COUNT(p.id) as total_products,
    COUNT(lps.id) as products_with_loyalty,
    CASE 
        WHEN COUNT(lps.id) = COUNT(p.id) THEN '✅ ALL PRODUCTS CONFIGURED'
        ELSE CONCAT('⚠️ ', COUNT(p.id) - COUNT(lps.id), ' PRODUCTS MISSING LOYALTY SETTINGS')
    END as status
FROM public.products p
LEFT JOIN public.loyalty_product_settings lps ON p.id = lps.product_id;

SELECT '🎉 Loyalty coins should now be visible in product cards!' as result;