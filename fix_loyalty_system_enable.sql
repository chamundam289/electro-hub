-- Fix loyalty system enable issue
-- Enable the loyalty system globally

-- Update loyalty system settings to enable the system
UPDATE public.loyalty_system_settings 
SET 
    is_system_enabled = true,
    updated_at = now()
WHERE id IS NOT NULL;

-- If no settings exist, create default enabled settings
INSERT INTO public.loyalty_system_settings (
    is_system_enabled,
    default_coins_per_rupee,
    min_coins_to_redeem,
    max_coins_per_transaction,
    coins_expiry_days,
    welcome_bonus_coins,
    referral_bonus_coins,
    created_at,
    updated_at
) 
SELECT 
    true as is_system_enabled,
    0.1 as default_coins_per_rupee,
    100 as min_coins_to_redeem,
    1000 as max_coins_per_transaction,
    365 as coins_expiry_days,
    50 as welcome_bonus_coins,
    25 as referral_bonus_coins,
    now() as created_at,
    now() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_system_settings);

-- Ensure all existing products have loyalty settings
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
    CASE 
        WHEN p.price > 10000 THEN 50
        WHEN p.price > 5000 THEN 25
        ELSE 10
    END as coins_earned_per_purchase,
    CASE 
        WHEN p.price > 10000 THEN 500
        WHEN p.price > 5000 THEN 250
        ELSE 100
    END as coins_required_to_buy,
    true as is_coin_purchase_enabled,
    true as is_coin_earning_enabled,
    now() as created_at,
    now() as updated_at
FROM public.products p
WHERE NOT EXISTS (
    SELECT 1 FROM public.loyalty_product_settings lps 
    WHERE lps.product_id = p.id
);

-- Grant permissions
GRANT ALL ON public.loyalty_system_settings TO authenticated, anon, service_role;
GRANT ALL ON public.loyalty_product_settings TO authenticated, anon, service_role;