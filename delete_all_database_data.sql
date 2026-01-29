-- ============================================
-- ⚠️ DELETE ALL DATA FROM ALL TABLES
-- ============================================
-- WARNING: This will permanently delete ALL data from your database!
-- Make sure you have a backup before running this script.
-- This action is IRREVERSIBLE!

-- ============================================
-- STEP 1: DISABLE FOREIGN KEY CONSTRAINTS
-- ============================================
SET session_replication_role = replica;

-- ============================================
-- STEP 2: DELETE DATA FROM ALL TABLES
-- ============================================

-- Delete from loyalty system tables first (child tables)
DELETE FROM public.loyalty_transactions;
DELETE FROM public.loyalty_coins_wallet;
DELETE FROM public.loyalty_product_settings;
DELETE FROM public.loyalty_system_settings;

-- Delete from product related tables
DELETE FROM public.product_images;
DELETE FROM public.offer_products;
DELETE FROM public.offers;

-- Delete from order related tables
DELETE FROM public.order_items;
DELETE FROM public.orders;

-- Delete from inventory and business tables
DELETE FROM public.inventory_transactions;
DELETE FROM public.expenses;
DELETE FROM public.expense_categories;
DELETE FROM public.suppliers;

-- Delete from lead management tables
DELETE FROM public.lead_activities;
DELETE FROM public.leads;

-- Delete from mobile services tables
DELETE FROM public.mobile_recharge_transactions;
DELETE FROM public.mobile_repair_services;

-- Delete from product and category tables
DELETE FROM public.products;
DELETE FROM public.categories;

-- Delete from customer and user related tables
DELETE FROM public.customers;

-- Delete from settings tables
DELETE FROM public.website_settings;

-- Delete from popup tables
DELETE FROM public.popups;

-- ============================================
-- STEP 3: RE-ENABLE FOREIGN KEY CONSTRAINTS
-- ============================================
SET session_replication_role = DEFAULT;

-- ============================================
-- STEP 4: RESET AUTO-INCREMENT SEQUENCES (if any)
-- ============================================
-- Note: Most tables use UUID, so no sequences to reset

-- ============================================
-- STEP 5: VERIFY DELETION
-- ============================================
SELECT 'Data Deletion Complete' as status;

-- Show row counts for all tables to verify deletion
SELECT 
    'categories' as table_name, 
    COUNT(*) as row_count 
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
-- STEP 6: OPTIONAL - DELETE STORAGE FILES
-- ============================================
-- Note: This script only deletes database records.
-- To delete uploaded files from Supabase Storage, you need to:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Select the bucket (e.g., 'product-images')
-- 3. Delete all files manually or use the Storage API

SELECT 'IMPORTANT: Remember to delete files from Supabase Storage buckets manually!' as reminder;