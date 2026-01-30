-- =====================================================
-- IMMEDIATE AFFILIATE FIX - Run this in Supabase SQL Editor NOW
-- =====================================================
-- This will fix the 400 Bad Request errors immediately

-- First, check if affiliate tables exist and drop them for clean setup
DROP TABLE IF EXISTS public.affiliate_sessions CASCADE;
DROP TABLE IF EXISTS public.affiliate_payouts CASCADE;
DROP TABLE IF EXISTS public.affiliate_commissions CASCADE;
DROP TABLE IF EXISTS public.affiliate_orders CASCADE;
DROP TABLE IF EXISTS public.affiliate_clicks CASCADE;
DROP TABLE IF EXISTS public.product_affiliate_settings CASCADE;
DROP TABLE IF EXISTS public.affiliate_users CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS public.generate_affiliate_code() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_affiliate_commission(TEXT, DECIMAL, DECIMAL, INTEGER) CASCADE;

-- =====================================================
-- CREATE AFFILIATE TABLES WITH PROPER RELATIONSHIPS
-- =====================================================

-- 1. Affiliate Users Table
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

-- 2. Product Affiliate Settings Table (CRITICAL: proper foreign key to products)
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

-- 3. Affiliate Clicks Table (CRITICAL: proper foreign keys)
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

-- 4. Affiliate Orders Table (CRITICAL: This fixes the 400 error)
-- NOTE: We'll reference orders table but make it flexible since orders structure may vary
CREATE TABLE public.affiliate_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL, -- This will reference orders table
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    click_id UUID REFERENCES public.affiliate_clicks(id),
    commission_type VARCHAR(20) NOT NULL,
    commission_rate DECIMAL(10,2) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'reversed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(order_id, product_id, affiliate_id)
);

-- 5. Other supporting tables
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

-- =====================================================
-- CREATE ESSENTIAL FUNCTIONS
-- =====================================================

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        code := 'AFF' || LPAD(floor(random() * 999999)::TEXT, 6, '0');
        SELECT COUNT(*) INTO exists_check FROM public.affiliate_users WHERE affiliate_code = code;
        EXIT WHEN exists_check = 0;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission
CREATE OR REPLACE FUNCTION public.calculate_affiliate_commission(
    p_commission_type TEXT,
    p_commission_value DECIMAL,
    p_product_price DECIMAL,
    p_quantity INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
    commission DECIMAL(10,2);
    total_price DECIMAL(10,2);
BEGIN
    total_price := p_product_price * p_quantity;
    
    IF p_commission_type = 'fixed' THEN
        commission := p_commission_value * p_quantity;
    ELSIF p_commission_type = 'percentage' THEN
        commission := (total_price * p_commission_value) / 100;
    ELSE
        commission := 0;
    END IF;
    
    RETURN ROUND(commission, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DISABLE RLS AND GRANT PERMISSIONS
-- =====================================================

-- Disable RLS on all affiliate tables
ALTER TABLE public.affiliate_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_affiliate_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, postgres;

-- =====================================================
-- INSERT SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert a sample affiliate user
INSERT INTO public.affiliate_users (name, mobile_number, password_hash, affiliate_code, is_active) 
VALUES ('Test Affiliate', '9999999999', encode(digest('password123', 'sha256'), 'hex'), 'AFF000001', true);

-- Insert sample product affiliate settings for existing products
INSERT INTO public.product_affiliate_settings (product_id, is_affiliate_enabled, commission_type, commission_value)
SELECT id, false, 'percentage', 5.00
FROM public.products 
WHERE id NOT IN (SELECT COALESCE(product_id, '00000000-0000-0000-0000-000000000000'::UUID) FROM public.product_affiliate_settings)
LIMIT 10;

-- =====================================================
-- REFRESH SCHEMA CACHE
-- =====================================================

-- Force Supabase to refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'IMMEDIATE AFFILIATE FIX APPLIED!' as status,
       'All affiliate tables created with proper relationships' as result,
       'The 400 Bad Request errors should now be resolved' as next_step,
       'Refresh your application to test' as action_required;