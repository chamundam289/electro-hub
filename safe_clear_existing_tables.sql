-- ============================================
-- 🛡️ SAFE CLEAR EXISTING TABLES DATA ONLY
-- ============================================
-- यह script सिर्फ existing tables का data delete करेगा

-- First, let's check which tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- DELETE DATA FROM EXISTING TABLES ONLY
-- ============================================

-- Core tables (most likely to exist)
DELETE FROM public.products WHERE true;
DELETE FROM public.categories WHERE true;
DELETE FROM public.orders WHERE true;
DELETE FROM public.customers WHERE true;

-- Try to delete from other tables if they exist
DO $$
BEGIN
    -- Delete from loyalty tables if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_transactions') THEN
        DELETE FROM public.loyalty_transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_coins_wallet') THEN
        DELETE FROM public.loyalty_coins_wallet;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_product_settings') THEN
        DELETE FROM public.loyalty_product_settings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_system_settings') THEN
        DELETE FROM public.loyalty_system_settings;
    END IF;
    
    -- Delete from product images if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
        DELETE FROM public.product_images;
    END IF;
    
    -- Delete from order items if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        DELETE FROM public.order_items;
    END IF;
    
    -- Delete from offers if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers') THEN
        DELETE FROM public.offers;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offer_products') THEN
        DELETE FROM public.offer_products;
    END IF;
    
    -- Delete from inventory if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_transactions') THEN
        DELETE FROM public.inventory_transactions;
    END IF;
    
    -- Delete from expenses if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
        DELETE FROM public.expenses;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expense_categories') THEN
        DELETE FROM public.expense_categories;
    END IF;
    
    -- Delete from suppliers if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        DELETE FROM public.suppliers;
    END IF;
    
    -- Delete from leads if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        DELETE FROM public.leads;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_activities') THEN
        DELETE FROM public.lead_activities;
    END IF;
    
    -- Delete from mobile services if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mobile_recharge_transactions') THEN
        DELETE FROM public.mobile_recharge_transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mobile_repair_services') THEN
        DELETE FROM public.mobile_repair_services;
    END IF;
    
    -- Delete from settings if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_settings') THEN
        DELETE FROM public.website_settings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'popups') THEN
        DELETE FROM public.popups;
    END IF;
    
END $$;

-- ============================================
-- VERIFY DELETION
-- ============================================
SELECT 'Data deletion completed for existing tables!' as status;

-- Show row counts for existing tables
SELECT 
    t.table_name,
    COALESCE(
        (SELECT COUNT(*) 
         FROM information_schema.tables t2 
         WHERE t2.table_name = t.table_name 
           AND t2.table_schema = 'public'), 0
    ) as table_exists,
    CASE 
        WHEN t.table_name IN ('products', 'categories', 'orders', 'customers') THEN
            (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.table_name)
        ELSE 0
    END as remaining_rows
FROM (
    SELECT 'products' as table_name
    UNION SELECT 'categories'
    UNION SELECT 'orders' 
    UNION SELECT 'customers'
    UNION SELECT 'loyalty_transactions'
    UNION SELECT 'loyalty_coins_wallet'
    UNION SELECT 'product_images'
    UNION SELECT 'order_items'
) t
ORDER BY t.table_name;