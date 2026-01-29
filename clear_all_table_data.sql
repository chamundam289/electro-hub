-- ============================================
-- 🧹 CLEAR ALL TABLE DATA (KEEP TABLE STRUCTURE)
-- ============================================
-- यह सिर्फ डेटा डिलीट करेगा, टेबल स्ट्रक्चर रहेगा

-- Method 1: Using DELETE (Safer, keeps structure)
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

-- Verify all data is deleted
SELECT 'All table data cleared successfully!' as status;

-- Show remaining row counts (should all be 0)
SELECT 
    table_name,
    (xpath('/row/c/text()', query_to_xml(format('SELECT COUNT(*) as c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::int as row_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;