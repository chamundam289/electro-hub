-- ============================================
-- ✅ VERIFY LOYALTY CONFIGURATION
-- ============================================

-- 1. Check if loyalty tables exist
SELECT 'Tables Status' as check_type, 
       CASE WHEN COUNT(*) = 2 THEN '✅ All tables exist' 
            ELSE '❌ Missing tables' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('loyalty_product_settings', 'loyalty_system_settings');

-- 2. Check system settings
SELECT 'System Settings' as check_type,
       CASE WHEN is_system_enabled THEN '✅ System enabled' 
            ELSE '❌ System disabled' END as status,
       default_coins_per_rupee,
       min_coins_to_redeem
FROM public.loyalty_system_settings 
LIMIT 1;

-- 3. Check product settings count
SELECT 'Product Settings' as check_type,
       CONCAT('✅ ', COUNT(*), ' products configured') as status
FROM public.loyalty_product_settings;

-- 4. Show sample configured products
SELECT 'Sample Products' as check_type,
       p.name as product_name,
       lps.coins_earned_per_purchase as earn_coins,
       lps.coins_required_to_buy as redeem_coins,
       lps.is_coin_purchase_enabled as redemption_enabled
FROM public.products p
JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
LIMIT 5;

-- 5. Check for unconfigured products
SELECT 'Unconfigured Products' as check_type,
       CONCAT('⚠️ ', COUNT(*), ' products need configuration') as status
FROM public.products p
LEFT JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
WHERE lps.product_id IS NULL;

-- 6. Final status
SELECT 'Overall Status' as check_type,
       CASE 
         WHEN (SELECT COUNT(*) FROM public.loyalty_product_settings) > 0 
         AND (SELECT is_system_enabled FROM public.loyalty_system_settings LIMIT 1) = true
         THEN '🎉 Loyalty system fully configured!'
         ELSE '⚠️ Configuration incomplete'
       END as status;