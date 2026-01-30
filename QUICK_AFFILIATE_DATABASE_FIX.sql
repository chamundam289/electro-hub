-- =====================================================
-- QUICK AFFILIATE DATABASE FIX
-- =====================================================
-- Run this in Supabase SQL Editor to fix the 400 Bad Request error

-- Check if affiliate tables exist, if not create them
DO $$
BEGIN
    -- Check if affiliate_users table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_users') THEN
        -- Create affiliate_users table
        CREATE TABLE public.affiliate_users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            mobile_number VARCHAR(15) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            affiliate_code VARCHAR(20) UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT true,
            total_clicks INTEGER DEFAULT 0,
            total_orders INTEGER DEFAULT 0,
            total_earnings DECIMAL(10,2) DEFAULT 0.00,
            pending_commission DECIMAL(10,2) DEFAULT 0.00,
            paid_commission DECIMAL(10,2) DEFAULT 0.00,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Disable RLS and grant permissions
        ALTER TABLE public.affiliate_users DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.affiliate_users TO anon, authenticated, postgres;
        
        RAISE NOTICE 'affiliate_users table created';
    END IF;

    -- Check if product_affiliate_settings table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_affiliate_settings') THEN
        CREATE TABLE public.product_affiliate_settings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
            is_affiliate_enabled BOOLEAN DEFAULT false,
            commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('fixed', 'percentage')),
            commission_value DECIMAL(10,2) DEFAULT 0.00,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(product_id)
        );
        
        ALTER TABLE public.product_affiliate_settings DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.product_affiliate_settings TO anon, authenticated, postgres;
        
        RAISE NOTICE 'product_affiliate_settings table created';
    END IF;

    -- Check if affiliate_clicks table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_clicks') THEN
        CREATE TABLE public.affiliate_clicks (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
            user_session_id TEXT,
            ip_address INET,
            user_agent TEXT,
            referrer_url TEXT,
            clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            converted_to_order BOOLEAN DEFAULT false,
            order_id UUID
        );
        
        ALTER TABLE public.affiliate_clicks DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.affiliate_clicks TO anon, authenticated, postgres;
        
        RAISE NOTICE 'affiliate_clicks table created';
    END IF;

    -- Check if affiliate_orders table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_orders') THEN
        CREATE TABLE public.affiliate_orders (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
            order_id UUID NOT NULL,
            product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
            click_id UUID REFERENCES public.affiliate_clicks(id),
            commission_type VARCHAR(20) NOT NULL,
            commission_rate DECIMAL(10,2) NOT NULL,
            product_price DECIMAL(10,2) NOT NULL,
            quantity INTEGER NOT NULL,
            commission_amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'reversed')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            confirmed_at TIMESTAMP WITH TIME ZONE
        );
        
        ALTER TABLE public.affiliate_orders DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.affiliate_orders TO anon, authenticated, postgres;
        
        RAISE NOTICE 'affiliate_orders table created';
    END IF;

    -- Check if affiliate_commissions table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_commissions') THEN
        CREATE TABLE public.affiliate_commissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
            order_id UUID,
            affiliate_order_id UUID REFERENCES public.affiliate_orders(id),
            transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'reversed', 'paid')),
            amount DECIMAL(10,2) NOT NULL,
            description TEXT,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP WITH TIME ZONE
        );
        
        ALTER TABLE public.affiliate_commissions DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.affiliate_commissions TO anon, authenticated, postgres;
        
        RAISE NOTICE 'affiliate_commissions table created';
    END IF;

    -- Check if affiliate_payouts table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affiliate_payouts') THEN
        CREATE TABLE public.affiliate_payouts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
            amount DECIMAL(10,2) NOT NULL,
            payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('upi', 'bank_transfer', 'manual')),
            payment_details JSONB,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
            transaction_id TEXT,
            notes TEXT,
            requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        ALTER TABLE public.affiliate_payouts DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.affiliate_payouts TO anon, authenticated, postgres;
        
        RAISE NOTICE 'affiliate_payouts table created';
    END IF;
END
$$;

-- Insert test affiliate user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.affiliate_users WHERE mobile_number = '9999999999') THEN
        INSERT INTO public.affiliate_users (name, mobile_number, password_hash, affiliate_code, is_active) 
        VALUES ('Test Affiliate', '9999999999', encode('password123'::bytea, 'base64'), 'AFF000001', true);
        RAISE NOTICE 'Test affiliate user created';
    END IF;
END
$$;

-- Grant all permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'QUICK AFFILIATE DATABASE FIX COMPLETED!' as status,
       'All affiliate tables are now ready' as result,
       'Test user: mobile 9999999999, password password123' as login_info;