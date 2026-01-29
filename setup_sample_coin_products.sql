-- Setup Sample Products with Coin Settings for Testing
-- Run this in Supabase SQL Editor to test the Smart Loyalty System

-- Update existing products with coin settings
UPDATE public.products 
SET 
  coins_earned_per_purchase = FLOOR(price * 0.1), -- 10% of price as coins earned
  coins_required_to_buy = FLOOR(price * 0.8), -- 80% of price in coins for redemption
  is_coin_purchase_enabled = true
WHERE price > 0 AND price <= 1000; -- Only for products under ₹1000

-- Update more expensive products with different coin ratios
UPDATE public.products 
SET 
  coins_earned_per_purchase = FLOOR(price * 0.05), -- 5% of price as coins earned
  coins_required_to_buy = FLOOR(price * 0.6), -- 60% of price in coins for redemption
  is_coin_purchase_enabled = true
WHERE price > 1000;

-- Create some specific test products with known coin values
INSERT INTO public.products (
  name, 
  slug, 
  description, 
  price, 
  offer_price,
  stock_quantity, 
  coins_earned_per_purchase, 
  coins_required_to_buy, 
  is_coin_purchase_enabled,
  is_visible,
  is_featured
) VALUES 
(
  'Test Product - 50 Coins', 
  'test-product-50-coins', 
  'A test product that can be redeemed with 50 coins', 
  500, 
  450,
  10, 
  50, -- Earn 50 coins when purchased
  50, -- Redeem with 50 coins
  true,
  true,
  false
),
(
  'Test Product - 100 Coins', 
  'test-product-100-coins', 
  'A test product that can be redeemed with 100 coins', 
  1000, 
  900,
  5, 
  100, -- Earn 100 coins when purchased
  100, -- Redeem with 100 coins
  true,
  true,
  false
),
(
  'Test Product - 25 Coins', 
  'test-product-25-coins', 
  'A budget test product that can be redeemed with 25 coins', 
  250, 
  200,
  20, 
  25, -- Earn 25 coins when purchased
  25, -- Redeem with 25 coins
  true,
  true,
  true
),
(
  'Premium Test Product - 200 Coins', 
  'premium-test-product-200-coins', 
  'A premium test product that can be redeemed with 200 coins', 
  2000, 
  1800,
  3, 
  200, -- Earn 200 coins when purchased
  200, -- Redeem with 200 coins
  true,
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  coins_earned_per_purchase = EXCLUDED.coins_earned_per_purchase,
  coins_required_to_buy = EXCLUDED.coins_required_to_buy,
  is_coin_purchase_enabled = EXCLUDED.is_coin_purchase_enabled;

-- Create a test user wallet with some coins for testing
-- Note: Replace 'test-user-id' with an actual user ID from auth.users
-- INSERT INTO public.loyalty_coins_wallet (
--   user_id, 
--   total_coins_earned, 
--   total_coins_used, 
--   available_coins
-- ) VALUES (
--   'test-user-id', -- Replace with actual user ID
--   150, 
--   0, 
--   150
-- ) ON CONFLICT (user_id) DO UPDATE SET
--   available_coins = 150,
--   total_coins_earned = 150;

-- Verify the setup
SELECT 
  name,
  price,
  coins_earned_per_purchase,
  coins_required_to_buy,
  is_coin_purchase_enabled,
  stock_quantity
FROM public.products 
WHERE is_coin_purchase_enabled = true 
ORDER BY coins_required_to_buy ASC
LIMIT 10;

-- Show summary
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN is_coin_purchase_enabled THEN 1 END) as coin_enabled_products,
  MIN(coins_required_to_buy) as min_coins_required,
  MAX(coins_required_to_buy) as max_coins_required,
  AVG(coins_required_to_buy) as avg_coins_required
FROM public.products 
WHERE is_visible = true;