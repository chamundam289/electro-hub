-- ============================================
-- 🎯 SIMPLE & SAFE DELETE - NO ERRORS
-- ============================================
-- यह script error नहीं देगा, सिर्फ existing tables clear करेगा

-- Basic core tables (ये usually हमेशा होते हैं):
DELETE FROM products;
DELETE FROM categories;
DELETE FROM orders;
DELETE FROM customers;

-- Loyalty tables (if exist):
DELETE FROM loyalty_transactions;
DELETE FROM loyalty_coins_wallet;
DELETE FROM loyalty_product_settings;
DELETE FROM loyalty_system_settings;

-- Product images (if exist):
DELETE FROM product_images;

-- Order items (if exist):
DELETE FROM order_items;

-- Other common tables:
DELETE FROM offers;
DELETE FROM expenses;
DELETE FROM suppliers;
DELETE FROM website_settings;

-- Success message:
SELECT 'Data cleared from existing tables!' as result;

-- Check remaining data:
SELECT 
    'products' as table_name, 
    COUNT(*) as remaining_rows 
FROM products
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'customers', COUNT(*) FROM customers;