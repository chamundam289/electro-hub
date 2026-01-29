-- ============================================
-- 🗑️ SIMPLE DATA DELETE - KEEP TABLES
-- ============================================
-- Tables रहेंगे, सिर्फ data delete होगा

-- सभी tables का data delete करने के लिए:

DELETE FROM loyalty_transactions;
DELETE FROM loyalty_coins_wallet;
DELETE FROM loyalty_product_settings;
DELETE FROM product_images;
DELETE FROM offer_products;
DELETE FROM order_items;
DELETE FROM inventory_transactions;
DELETE FROM lead_activities;
DELETE FROM mobile_recharge_transactions;
DELETE FROM mobile_repair_services;
DELETE FROM orders;
DELETE FROM offers;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM customers;
DELETE FROM expenses;
DELETE FROM expense_categories;
DELETE FROM suppliers;
DELETE FROM leads;
DELETE FROM loyalty_system_settings;
DELETE FROM website_settings;
DELETE FROM popups;

-- Check करने के लिए कि data delete हो गया:
SELECT 'Data deletion completed!' as message;

-- Row count check करें:
SELECT COUNT(*) as products_count FROM products;
SELECT COUNT(*) as orders_count FROM orders;
SELECT COUNT(*) as customers_count FROM customers;
SELECT COUNT(*) as categories_count FROM categories;