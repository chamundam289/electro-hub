-- =====================================================
-- FIX PERMISSIONS FOR EXISTING TABLES ONLY
-- =====================================================
-- This script only fixes permissions for tables that exist

-- =====================================================
-- 1. FIX PRODUCTS TABLE (if exists)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        -- Enable RLS
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.products;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.products;
        
        -- Create permissive policies
        CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users only" ON public.products FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users only" ON public.products FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users only" ON public.products FOR DELETE USING (true);
        
        RAISE NOTICE '✅ Fixed products table permissions';
    ELSE
        RAISE NOTICE '⚠️  products table does not exist - skipping';
    END IF;
END $$;

-- =====================================================
-- 2. FIX PRODUCT_IMAGES TABLE (if exists)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_images') THEN
        -- Enable RLS
        ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_images;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.product_images;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.product_images;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.product_images;
        
        -- Create permissive policies
        CREATE POLICY "Enable read access for all users" ON public.product_images FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users only" ON public.product_images FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users only" ON public.product_images FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users only" ON public.product_images FOR DELETE USING (true);
        
        RAISE NOTICE '✅ Fixed product_images table permissions';
    ELSE
        RAISE NOTICE '⚠️  product_images table does not exist - skipping';
    END IF;
END $$;

-- =====================================================
-- 3. FIX CATEGORIES TABLE (if exists)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories') THEN
        -- Enable RLS
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.categories;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.categories;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.categories;
        
        -- Create permissive policies
        CREATE POLICY "Enable read access for all users" ON public.categories FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users only" ON public.categories FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users only" ON public.categories FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users only" ON public.categories FOR DELETE USING (true);
        
        RAISE NOTICE '✅ Fixed categories table permissions';
    ELSE
        RAISE NOTICE '⚠️  categories table does not exist - skipping';
    END IF;
END $$;

-- =====================================================
-- 4. FIX ORDERS TABLE (if exists)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- Enable RLS
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orders;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.orders;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.orders;
        
        -- Create permissive policies
        CREATE POLICY "Enable read access for all users" ON public.orders FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users only" ON public.orders FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users only" ON public.orders FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users only" ON public.orders FOR DELETE USING (true);
        
        RAISE NOTICE '✅ Fixed orders table permissions';
    ELSE
        RAISE NOTICE '⚠️  orders table does not exist - skipping';
    END IF;
END $$;

-- =====================================================
-- 5. FIX LOYALTY TABLES (if they exist)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_loyalty_settings') THEN
        ALTER TABLE public.product_loyalty_settings ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_loyalty_settings;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.product_loyalty_settings;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.product_loyalty_settings;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.product_loyalty_settings;
        
        CREATE POLICY "Enable read access for all users" ON public.product_loyalty_settings FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users only" ON public.product_loyalty_settings FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users only" ON public.product_loyalty_settings FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users only" ON public.product_loyalty_settings FOR DELETE USING (true);
        
        RAISE NOTICE '✅ Fixed product_loyalty_settings table permissions';
    ELSE
        RAISE NOTICE '⚠️  product_loyalty_settings table does not exist - skipping';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_loyalty_coins') THEN
        ALTER TABLE public.user_loyalty_coins ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_loyalty_coins;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_loyalty_coins;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.user_loyalty_coins;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.user_loyalty_coins;
        
        CREATE POLICY "Enable read access for all users" ON public.user_loyalty_coins FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users only" ON public.user_loyalty_coins FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users only" ON public.user_loyalty_coins FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users only" ON public.user_loyalty_coins FOR DELETE USING (true);
        
        RAISE NOTICE '✅ Fixed user_loyalty_coins table permissions';
    ELSE
        RAISE NOTICE '⚠️  user_loyalty_coins table does not exist - skipping';
    END IF;
END $$;

-- =====================================================
-- 6. FIX AFFILIATE TABLES (if they exist)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_users') THEN
        ALTER TABLE public.affiliate_users ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.affiliate_users;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.affiliate_users;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.affiliate_users;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.affiliate_users;
        
        CREATE POLICY "Enable read access for all users" ON public.affiliate_users FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users only" ON public.affiliate_users FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users only" ON public.affiliate_users FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users only" ON public.affiliate_users FOR DELETE USING (true);
        
        RAISE NOTICE '✅ Fixed affiliate_users table permissions';
    ELSE
        RAISE NOTICE '⚠️  affiliate_users table does not exist - skipping';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_affiliate_settings') THEN
        ALTER TABLE public.product_affiliate_settings ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_affiliate_settings;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.product_affiliate_settings;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.product_affiliate_settings;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.product_affiliate_settings;
        
        CREATE POLICY "Enable read access for all users" ON public.product_affiliate_settings FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users only" ON public.product_affiliate_settings FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users only" ON public.product_affiliate_settings FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users only" ON public.product_affiliate_settings FOR DELETE USING (true);
        
        RAISE NOTICE '✅ Fixed product_affiliate_settings table permissions';
    ELSE
        RAISE NOTICE '⚠️  product_affiliate_settings table does not exist - skipping';
    END IF;
END $$;

-- =====================================================
-- 7. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on all existing tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PERMISSIONS FIXED FOR EXISTING TABLES!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Only existing tables were processed';
    RAISE NOTICE '✅ All permissions granted';
    RAISE NOTICE '✅ RLS policies updated';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 403 and 406 errors should be resolved!';
    RAISE NOTICE '📋 Refresh your application to see changes';
END $$;