-- ============================================
-- 🎯 DELETE DATA FROM SPECIFIC TABLES
-- ============================================
-- Use this if you want to delete data from specific tables only

-- ============================================
-- OPTION 1: DELETE ONLY PRODUCT DATA
-- ============================================
/*
DELETE FROM public.product_images;
DELETE FROM public.offer_products;
DELETE FROM public.loyalty_product_settings;
DELETE FROM public.products;
DELETE FROM public.categories;
*/

-- ============================================
-- OPTION 2: DELETE ONLY ORDER DATA
-- ============================================
/*
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.loyalty_transactions WHERE reference_type = 'order';
*/

-- ============================================
-- OPTION 3: DELETE ONLY LOYALTY DATA
-- ============================================
/*
DELETE FROM public.loyalty_transactions;
DELETE FROM public.loyalty_coins_wallet;
DELETE FROM public.loyalty_product_settings;
DELETE FROM public.loyalty_system_settings;
*/

-- ============================================
-- OPTION 4: DELETE ONLY CUSTOMER DATA
-- ============================================
/*
DELETE FROM public.customers;
DELETE FROM public.loyalty_coins_wallet;
DELETE FROM public.loyalty_transactions;
DELETE FROM public.orders;
DELETE FROM public.order_items;
*/

-- ============================================
-- OPTION 5: DELETE ONLY BUSINESS DATA (Keep Products)
-- ============================================
/*
DELETE FROM public.expenses;
DELETE FROM public.expense_categories;
DELETE FROM public.suppliers;
DELETE FROM public.inventory_transactions;
DELETE FROM public.leads;
DELETE FROM public.lead_activities;
DELETE FROM public.mobile_recharge_transactions;
DELETE FROM public.mobile_repair_services;
*/

-- ============================================
-- OPTION 6: RESET TO FRESH INSTALL (Keep Structure)
-- ============================================
/*
-- This keeps the table structure but removes all data
-- Uncomment the section you want to use

-- Delete all transactional data
DELETE FROM public.loyalty_transactions;
DELETE FROM public.loyalty_coins_wallet;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.inventory_transactions;
DELETE FROM public.expenses;
DELETE FROM public.lead_activities;
DELETE FROM public.leads;
DELETE FROM public.mobile_recharge_transactions;
DELETE FROM public.mobile_repair_services;

-- Delete all master data
DELETE FROM public.product_images;
DELETE FROM public.offer_products;
DELETE FROM public.offers;
DELETE FROM public.loyalty_product_settings;
DELETE FROM public.products;
DELETE FROM public.categories;
DELETE FROM public.customers;
DELETE FROM public.expense_categories;
DELETE FROM public.suppliers;

-- Keep system settings
-- DELETE FROM public.loyalty_system_settings;
-- DELETE FROM public.website_settings;
-- DELETE FROM public.popups;
*/

SELECT 'Choose and uncomment the section you want to execute' as instruction;