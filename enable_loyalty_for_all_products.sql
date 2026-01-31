-- Enable loyalty system for all products
-- This script ensures all products have loyalty settings configured

-- First, ensure the loyalty system is enabled globally
UPDATE loyalty_system_settings 
SET is_system_enabled = true 
WHERE id = 'eef33271-caed-4eb2-a7ea-aa4d5e288a0f';

-- Create loyalty settings for products that don't have them
INSERT INTO loyalty_product_settings (
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
    WHEN p.price <= 100 THEN 5
    WHEN p.price <= 500 THEN 10
    WHEN p.price <= 1000 THEN 20
    ELSE 30
  END as coins_earned_per_purchase,
  CASE 
    WHEN p.price <= 100 THEN 50
    WHEN p.price <= 500 THEN 100
    WHEN p.price <= 1000 THEN 200
    ELSE 300
  END as coins_required_to_buy,
  true as is_coin_purchase_enabled,
  true as is_coin_earning_enabled,
  NOW() as created_at,
  NOW() as updated_at
FROM products p
LEFT JOIN loyalty_product_settings lps ON p.id = lps.product_id
WHERE lps.product_id IS NULL;

-- Update existing settings to ensure they're enabled
UPDATE loyalty_product_settings 
SET 
  is_coin_purchase_enabled = true,
  is_coin_earning_enabled = true,
  updated_at = NOW()
WHERE is_coin_purchase_enabled = false OR is_coin_earning_enabled = false;

-- Verify the results
SELECT 
  'System Settings' as type,
  CASE WHEN is_system_enabled THEN 'Enabled' ELSE 'Disabled' END as status,
  default_coins_per_rupee::text as coins_per_rupee,
  min_coins_to_redeem::text as min_coins_to_redeem
FROM loyalty_system_settings 
WHERE id = 'eef33271-caed-4eb2-a7ea-aa4d5e288a0f'

UNION ALL

SELECT 
  'Product Settings' as type,
  COUNT(*)::text || ' products configured' as status,
  ROUND(AVG(coins_earned_per_purchase), 2)::text as coins_per_rupee,
  ROUND(AVG(coins_required_to_buy), 2)::text as min_coins_to_redeem
FROM loyalty_product_settings
WHERE is_coin_earning_enabled = true;