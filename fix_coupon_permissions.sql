-- ============================================
-- FIX COUPON SYSTEM PERMISSIONS
-- ============================================

-- First, let's drop the existing policies that are causing issues
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupon products" ON public.coupon_products;
DROP POLICY IF EXISTS "Admins can manage coupon categories" ON public.coupon_categories;
DROP POLICY IF EXISTS "Admins can manage all coupon usage" ON public.coupon_usage;
DROP POLICY IF EXISTS "Admins can manage user coupon assignments" ON public.user_coupons;
DROP POLICY IF EXISTS "Admins can view coupon analytics" ON public.coupon_analytics;

-- Create simplified policies that work with your current setup

-- Coupons Policies - Allow public read for active coupons, admin full access
CREATE POLICY "Allow public read active coupons" ON public.coupons
    FOR SELECT USING (
        is_active = true 
        AND start_date <= now() 
        AND (end_date IS NULL OR end_date >= now())
    );

CREATE POLICY "Allow admin full access to coupons" ON public.coupons
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Coupon Products Policies
CREATE POLICY "Allow public read coupon products" ON public.coupon_products
    FOR SELECT USING (true);

CREATE POLICY "Allow admin manage coupon products" ON public.coupon_products
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Coupon Categories Policies
CREATE POLICY "Allow public read coupon categories" ON public.coupon_categories
    FOR SELECT USING (true);

CREATE POLICY "Allow admin manage coupon categories" ON public.coupon_categories
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Coupon Usage Policies
CREATE POLICY "Allow users view own coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users insert own coupon usage" ON public.coupon_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admin manage all coupon usage" ON public.coupon_usage
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- User Coupons Policies
CREATE POLICY "Allow users view own assigned coupons" ON public.user_coupons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow admin manage user coupon assignments" ON public.user_coupons
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Coupon Analytics Policies
CREATE POLICY "Allow admin view coupon analytics" ON public.coupon_analytics
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Alternative: If the above still doesn't work, temporarily disable RLS for development
-- Uncomment the lines below ONLY for development/testing

-- ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.coupon_products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.coupon_categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.coupon_usage DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_coupons DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.coupon_analytics DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.coupons TO authenticated;
GRANT SELECT ON public.coupon_products TO authenticated;
GRANT SELECT ON public.coupon_categories TO authenticated;
GRANT SELECT, INSERT ON public.coupon_usage TO authenticated;
GRANT SELECT ON public.user_coupons TO authenticated;

-- Grant full permissions to service_role (for admin operations)
GRANT ALL ON public.coupons TO service_role;
GRANT ALL ON public.coupon_products TO service_role;
GRANT ALL ON public.coupon_categories TO service_role;
GRANT ALL ON public.coupon_usage TO service_role;
GRANT ALL ON public.user_coupons TO service_role;
GRANT ALL ON public.coupon_analytics TO service_role;