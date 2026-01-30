-- =====================================================
-- DISABLE RLS FOR EXISTING TABLES ONLY (DEVELOPMENT)
-- =====================================================
-- This script safely disables RLS only for tables that exist
-- WARNING: Only use this for development, NOT for production!

-- Disable RLS for existing tables only
DO $$
BEGIN
    -- Products table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for products table';
    END IF;
    
    -- Product images table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_images') THEN
        ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for product_images table';
    END IF;
    
    -- Categories table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories') THEN
        ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for categories table';
    END IF;
    
    -- Orders table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for orders table';
    END IF;
    
    -- Loyalty tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_loyalty_settings') THEN
        ALTER TABLE public.product_loyalty_settings DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for product_loyalty_settings table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_loyalty_coins') THEN
        ALTER TABLE public.user_loyalty_coins DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for user_loyalty_coins table';
    END IF;
    
    -- Affiliate tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_users') THEN
        ALTER TABLE public.affiliate_users DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for affiliate_users table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_affiliate_settings') THEN
        ALTER TABLE public.product_affiliate_settings DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for product_affiliate_settings table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_clicks') THEN
        ALTER TABLE public.affiliate_clicks DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for affiliate_clicks table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_orders') THEN
        ALTER TABLE public.affiliate_orders DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for affiliate_orders table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_commissions') THEN
        ALTER TABLE public.affiliate_commissions DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for affiliate_commissions table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_payouts') THEN
        ALTER TABLE public.affiliate_payouts DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for affiliate_payouts table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_sessions') THEN
        ALTER TABLE public.affiliate_sessions DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS for affiliate_sessions table';
    END IF;
END $$;

-- Grant full permissions to all existing tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  RLS DISABLED FOR EXISTING TABLES ONLY';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ Only existing tables were processed';
    RAISE NOTICE '✅ Full permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 All 403, 406 errors should be resolved!';
    RAISE NOTICE '⚠️  Remember to re-enable RLS for production!';
END $$;