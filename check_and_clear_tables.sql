-- ============================================
-- 🔍 CHECK EXISTING TABLES FIRST, THEN CLEAR
-- ============================================

-- STEP 1: Check which tables exist in your database
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;

-- ============================================
-- STEP 2: MANUAL DELETE (Copy only existing tables)
-- ============================================

-- Core tables (delete these if they exist in above list):
-- DELETE FROM public.categories;
-- DELETE FROM public.customers;
-- DELETE FROM public.orders;
-- DELETE FROM public.products;

-- Loyalty tables (delete these if they exist in above list):
-- DELETE FROM public.loyalty_coins_wallet;
-- DELETE FROM public.loyalty_product_settings;
-- DELETE FROM public.loyalty_system_settings;
-- DELETE FROM public.loyalty_transactions;

-- Product related (delete these if they exist in above list):
-- DELETE FROM public.product_images;
-- DELETE FROM public.order_items;

-- Business tables (delete these if they exist in above list):
-- DELETE FROM public.offers;
-- DELETE FROM public.offer_products;
-- DELETE FROM public.expenses;
-- DELETE FROM public.expense_categories;
-- DELETE FROM public.suppliers;
-- DELETE FROM public.inventory_transactions;

-- Lead management (delete these if they exist in above list):
-- DELETE FROM public.leads;
-- DELETE FROM public.lead_activities;

-- Settings (delete these if they exist in above list):
-- DELETE FROM public.website_settings;
-- DELETE FROM public.popups;

-- ============================================
-- STEP 3: VERIFICATION QUERY
-- ============================================
-- Run this after deletion to verify:
/*
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
*/