-- ============================================
-- FIX COUPON USAGE PERMISSIONS
-- ============================================

-- Disable RLS on coupon_usage table for development
ALTER TABLE public.coupon_usage DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.coupon_usage TO authenticated, anon;

-- Also ensure other coupon tables have proper permissions
ALTER TABLE public.coupon_analytics DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.coupon_analytics TO authenticated, anon;

-- Check if the tables exist and show their structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('coupon_usage', 'coupons', 'affiliate_users')
ORDER BY table_name, ordinal_position;