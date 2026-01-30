-- ============================================
-- DISABLE COUPON RLS FOR DEVELOPMENT
-- ============================================

-- Temporarily disable RLS on all coupon tables for development
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_analytics DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.coupons TO authenticated, anon;
GRANT ALL ON public.coupon_products TO authenticated, anon;
GRANT ALL ON public.coupon_categories TO authenticated, anon;
GRANT ALL ON public.coupon_usage TO authenticated, anon;
GRANT ALL ON public.user_coupons TO authenticated, anon;
GRANT ALL ON public.coupon_analytics TO authenticated, anon;

-- Grant sequence permissions if needed
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;