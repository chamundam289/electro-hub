-- Fix loyalty settings for a single product
-- Replace 'YOUR_PRODUCT_ID' with actual product ID

INSERT INTO public.loyalty_product_settings (
    product_id,
    coins_earned_per_purchase,
    coins_required_to_buy,
    is_coin_purchase_enabled,
    is_coin_earning_enabled
) VALUES (
    'YOUR_PRODUCT_ID',  -- Replace with actual product ID
    15,                 -- Coins earned per purchase
    150,                -- Coins required to buy
    true,               -- Enable coin redemption
    true                -- Enable coin earning
) ON CONFLICT (product_id) DO UPDATE SET
    coins_earned_per_purchase = EXCLUDED.coins_earned_per_purchase,
    coins_required_to_buy = EXCLUDED.coins_required_to_buy,
    is_coin_purchase_enabled = EXCLUDED.is_coin_purchase_enabled,
    updated_at = now();

-- Verify the fix
SELECT 
    p.name,
    lps.coins_earned_per_purchase,
    lps.coins_required_to_buy,
    lps.is_coin_purchase_enabled
FROM public.products p
JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
WHERE p.id = 'YOUR_PRODUCT_ID';