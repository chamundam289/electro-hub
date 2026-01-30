-- =====================================================
-- DISABLE RLS FOR DEVELOPMENT (TEMPORARY FIX)
-- =====================================================
-- This script disables Row Level Security for easier development
-- WARNING: Only use this for development, NOT for production!

-- Disable RLS on all main tables
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on loyalty tables
ALTER TABLE public.product_loyalty_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_coins DISABLE ROW LEVEL SECURITY;

-- Disable RLS on affiliate tables
ALTER TABLE public.affiliate_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_affiliate_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_sessions DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '⚠️  RLS DISABLED FOR DEVELOPMENT';
    RAISE NOTICE '================================';
    RAISE NOTICE '✅ All Row Level Security policies disabled';
    RAISE NOTICE '✅ Full permissions granted to all users';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 All 403, 406 errors should be resolved!';
    RAISE NOTICE '⚠️  Remember to re-enable RLS for production!';
END $$;