-- Check if products have loyalty settings configured
SELECT 
    p.id,
    p.name,
    p.price,
    p.offer_price,
    lps.coins_earned_per_purchase,
    lps.coins_required_to_buy,
    lps.is_coin_purchase_enabled,
    lps.is_coin_earning_enabled
FROM products p
LEFT JOIN loyalty_product_settings lps ON p.id = lps.product_id
ORDER BY p.created_at DESC
LIMIT 10;