-- ============================================
-- 🗑️ DELETE ALL DATA FROM TABLES (KEEP TABLES)
-- ============================================
-- This will delete all data but keep the table structure
-- Tables will remain, only data will be deleted

-- ============================================
-- STEP 1: DISABLE FOREIGN KEY CONSTRAINTS
-- ============================================
SET session_replication_role = replica;

-- ============================================
-- STEP 2: DELETE ALL DATA FROM TABLES
-- ============================================

-- Delete from child tables first (to avoid foreign key conflicts)
DELETE FROM public.loyalty_transactions;
DELETE FROM public.loyalty_coins_wallet;
DELETE FROM public.loyalty_product_settings;
DELETE FROM public.product_images;
DELETE FROM public.offer_products;
DELETE FROM public.order_items;
DELETE FROM public.inventory_transactions;
DELETE FROM public.lead_activities;
DELETE FROM public.mobile_recharge_transactions;
DELETE FROM public.mobile_repair_services;

-- Delete from parent tables
DELETE FROM public.orders;
DELETE FROM public.offers;
DELETE FROM public.products;
DELETE FROM public.categories;
DELETE FROM public.customers;
DELETE FROM public.expenses;
DELETE FROM public.expense_categories;
DELETE FROM public.suppliers;
DELETE FROM public.leads;
DELETE FROM public.loyalty_system_settings;
DELETE FROM public.website_settings;
DELETE FROM public.popups;

-- ============================================
-- STEP 3: RE-ENABLE FOREIGN KEY CONSTRAINTS
-- ============================================
SET session_replication_role = DEFAULT;

-- ============================================
-- STEP 4: VERIFY DATA DELETION
-- ============================================
SELECT 'All table data deleted successfully! Tables structure preserved.' as status;

-- Show row counts to verify all data is deleted
SELECT 
    'categories' as table_name, 
    COUNT(*) as remaining_rows 
FROM public.categories
UNION ALL
SELECT 'products', COUNT(*) FROM public.products
UNION ALL
SELECT 'product_images', COUNT(*) FROM public.product_images
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM public.order_items
UNION ALL
SELECT 'offers', COUNT(*) FROM public.offers
UNION ALL
SELECT 'offer_products', COUNT(*) FROM public.offer_products
UNION ALL
SELECT 'inventory_transactions', COUNT(*) FROM public.inventory_transactions
UNION ALL
SELECT 'expenses', COUNT(*) FROM public.expenses
UNION ALL
SELECT 'expense_categories', COUNT(*) FROM public.expense_categories
UNION ALL
SELECT 'suppliers', COUNT(*) FROM public.suppliers
UNION ALL
SELECT 'leads', COUNT(*) FROM public.leads
UNION ALL
SELECT 'lead_activities', COUNT(*) FROM public.lead_activities
UNION ALL
SELECT 'mobile_recharge_transactions', COUNT(*) FROM public.mobile_recharge_transactions
UNION ALL
SELECT 'mobile_repair_services', COUNT(*) FROM public.mobile_repair_services
UNION ALL
SELECT 'loyalty_transactions', COUNT(*) FROM public.loyalty_transactions
UNION ALL
SELECT 'loyalty_coins_wallet', COUNT(*) FROM public.loyalty_coins_wallet
UNION ALL
SELECT 'loyalty_product_settings', COUNT(*) FROM public.loyalty_product_settings
UNION ALL
SELECT 'loyalty_system_settings', COUNT(*) FROM public.loyalty_system_settings
UNION ALL
SELECT 'website_settings', COUNT(*) FROM public.website_settings
UNION ALL
SELECT 'popups', COUNT(*) FROM public.popups
ORDER BY table_name;

-- ============================================
-- CONFIRMATION MESSAGE
-- ============================================
SELECT 
    'SUCCESS: All data deleted from all tables.' as result,
    'Tables structure is preserved and ready for new data.' as note,
    'You can now add fresh data to your application.' as next_step;