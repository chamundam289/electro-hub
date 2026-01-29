-- Add loyalty settings to existing products that don't have them
-- This will make loyalty coins visible in product cards

-- First, check current status
SELECT 
    COUNT(*) as total_products,
    COUNT(lps.product_id) as products_with_loyalty_settings
FROM products p
LEFT JOIN loyalty_product_settings lps ON p.id = lps.product_id
WHERE p.is_visible = true;

-- Add loyalty settings for products that don't have them
INSERT INTO public.loyalty_product_settings (
    product_id, 
    coins_earned_per_purchase, 
    coins_required_to_buy, 
    is_coin_purchase_enabled,
    is_coin_earning_enabled
)
SELECT 
    p.id as product_id,
    CASE 
        WHEN p.price <= 500 THEN FLOOR(p.price * 0.1)  -- 10% for products ≤ ₹500
        WHEN p.price <= 1000 THEN FLOOR(p.price * 0.08) -- 8% for products ≤ ₹1000
        ELSE FLOOR(p.price * 0.05)                      -- 5% for expensive products
    END as coins_earned_per_purchase,
    CASE 
        WHEN p.price <= 500 THEN FLOOR(p.price * 0.9)   -- 90% for products ≤ ₹500
        WHEN p.price <= 1000 THEN FLOOR(p.price * 0.8)  -- 80% for products ≤ ₹1000
        ELSE FLOOR(p.price * 0.7)                       -- 70% for expensive products
    END as coins_required_to_buy,
    true as is_coin_purchase_enabled,
    true as is_coin_earning_enabled
FROM public.products p
LEFT JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
WHERE p.price > 0 
  AND p.is_visible = true 
  AND lps.product_id IS NULL  -- Only products without loyalty settings
ON CONFLICT (product_id) DO NOTHING;

-- Verify the results
SELECT 
    p.name,
    p.price,
    p.offer_price,
    lps.coins_earned_per_purchase,
    lps.coins_required_to_buy,
    lps.is_coin_purchase_enabled
FROM products p
JOIN loyalty_product_settings lps ON p.id = lps.product_id
WHERE p.is_visible = true
ORDER BY p.created_at DESC
LIMIT 10;

-- Summary after adding settings
SELECT 
    COUNT(*) as total_visible_products,
    COUNT(lps.product_id) as products_with_loyalty_settings,
    ROUND(COUNT(lps.product_id) * 100.0 / COUNT(*), 2) as percentage_with_settings
FROM products p
LEFT JOIN loyalty_product_settings lps ON p.id = lps.product_id
WHERE p.is_visible = true;