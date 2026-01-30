-- =====================================================
-- AFFILIATE MARKETING SYSTEM - FINAL DATABASE SETUP
-- =====================================================
-- Complete production-ready database structure
-- Run this script in your Supabase SQL Editor

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.affiliate_sessions CASCADE;
DROP TABLE IF EXISTS public.affiliate_payouts CASCADE;
DROP TABLE IF EXISTS public.affiliate_commissions CASCADE;
DROP TABLE IF EXISTS public.affiliate_orders CASCADE;
DROP TABLE IF EXISTS public.affiliate_clicks CASCADE;
DROP TABLE IF EXISTS public.product_affiliate_settings CASCADE;
DROP TABLE IF EXISTS public.affiliate_users CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.generate_affiliate_code() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_affiliate_commission(TEXT, DECIMAL, DECIMAL, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.update_affiliate_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.trigger_update_affiliate_stats() CASCADE;

-- =====================================================
-- 1. AFFILIATE USERS TABLE
-- =====================================================
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

-- =====================================================
-- 2. PRODUCT AFFILIATE SETTINGS TABLE
-- =====================================================
CREATE TABLE public.product_affiliate_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    is_affiliate_enabled BOOLEAN DEFAULT false,
    commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('fixed', 'percentage')),
    commission_value DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id)
);

-- =====================================================
-- 3. AFFILIATE CLICKS TABLE
-- =====================================================
CREATE TABLE public.affiliate_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    user_session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    converted_to_order BOOLEAN DEFAULT false,
    order_id UUID
);

-- =====================================================
-- 4. AFFILIATE ORDERS TABLE
-- =====================================================
CREATE TABLE public.affiliate_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
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

-- =====================================================
-- 5. AFFILIATE COMMISSIONS TABLE
-- =====================================================
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

-- =====================================================
-- 6. AFFILIATE PAYOUTS TABLE
-- =====================================================
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
-- 7. AFFILIATE SESSIONS TABLE
-- =====================================================
CREATE TABLE public.affiliate_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Affiliate Users Indexes
CREATE INDEX idx_affiliate_users_mobile ON public.affiliate_users(mobile_number);
CREATE INDEX idx_affiliate_users_code ON public.affiliate_users(affiliate_code);
CREATE INDEX idx_affiliate_users_active ON public.affiliate_users(is_active);

-- Product Affiliate Settings Indexes
CREATE INDEX idx_product_affiliate_settings_product ON public.product_affiliate_settings(product_id);
CREATE INDEX idx_product_affiliate_settings_enabled ON public.product_affiliate_settings(is_affiliate_enabled);

-- Affiliate Clicks Indexes
CREATE INDEX idx_affiliate_clicks_affiliate ON public.affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_product ON public.affiliate_clicks(product_id);
CREATE INDEX idx_affiliate_clicks_session ON public.affiliate_clicks(user_session_id);
CREATE INDEX idx_affiliate_clicks_date ON public.affiliate_clicks(clicked_at);

-- Affiliate Orders Indexes
CREATE INDEX idx_affiliate_orders_affiliate ON public.affiliate_orders(affiliate_id);
CREATE INDEX idx_affiliate_orders_order ON public.affiliate_orders(order_id);
CREATE INDEX idx_affiliate_orders_status ON public.affiliate_orders(status);

-- Affiliate Commissions Indexes
CREATE INDEX idx_affiliate_commissions_affiliate ON public.affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_type ON public.affiliate_commissions(transaction_type);
CREATE INDEX idx_affiliate_commissions_status ON public.affiliate_commissions(status);

-- Affiliate Payouts Indexes
CREATE INDEX idx_affiliate_payouts_affiliate ON public.affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON public.affiliate_payouts(status);

-- Affiliate Sessions Indexes
CREATE INDEX idx_affiliate_sessions_session ON public.affiliate_sessions(session_id);
CREATE INDEX idx_affiliate_sessions_affiliate ON public.affiliate_sessions(affiliate_id);

-- =====================================================
-- FUNCTIONS
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

-- Function to update affiliate stats
CREATE OR REPLACE FUNCTION public.update_affiliate_stats(p_affiliate_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.affiliate_users 
    SET 
        total_clicks = (
            SELECT COUNT(*) FROM public.affiliate_clicks 
            WHERE affiliate_id = p_affiliate_id
        ),
        total_orders = (
            SELECT COUNT(*) FROM public.affiliate_orders 
            WHERE affiliate_id = p_affiliate_id AND status = 'confirmed'
        ),
        total_earnings = (
            SELECT COALESCE(SUM(amount), 0) FROM public.affiliate_commissions 
            WHERE affiliate_id = p_affiliate_id AND transaction_type = 'earned' AND status = 'confirmed'
        ),
        pending_commission = (
            SELECT COALESCE(SUM(amount), 0) FROM public.affiliate_commissions 
            WHERE affiliate_id = p_affiliate_id AND transaction_type = 'earned' AND status = 'pending'
        ),
        paid_commission = (
            SELECT COALESCE(SUM(amount), 0) FROM public.affiliate_commissions 
            WHERE affiliate_id = p_affiliate_id AND transaction_type = 'paid' AND status = 'confirmed'
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_affiliate_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-update affiliate stats
CREATE OR REPLACE FUNCTION public.trigger_update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.update_affiliate_stats(NEW.affiliate_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.update_affiliate_stats(OLD.affiliate_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Create triggers for automatic stats updates
CREATE TRIGGER trigger_affiliate_clicks_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.affiliate_clicks
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_affiliate_stats();

CREATE TRIGGER trigger_affiliate_orders_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.affiliate_orders
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_affiliate_stats();

CREATE TRIGGER trigger_affiliate_commissions_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.affiliate_commissions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_affiliate_stats();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.affiliate_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_sessions ENABLE ROW LEVEL SECURITY;

-- Affiliate Users Policies
CREATE POLICY "Enable read access for all users" ON public.affiliate_users FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.affiliate_users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.affiliate_users FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.affiliate_users FOR DELETE USING (auth.role() = 'authenticated');

-- Product Affiliate Settings Policies
CREATE POLICY "Enable read access for all users" ON public.product_affiliate_settings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.product_affiliate_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.product_affiliate_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.product_affiliate_settings FOR DELETE USING (auth.role() = 'authenticated');

-- Affiliate Clicks Policies
CREATE POLICY "Enable read access for all users" ON public.affiliate_clicks FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.affiliate_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.affiliate_clicks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.affiliate_clicks FOR DELETE USING (auth.role() = 'authenticated');

-- Affiliate Orders Policies
CREATE POLICY "Enable read access for all users" ON public.affiliate_orders FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.affiliate_orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.affiliate_orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.affiliate_orders FOR DELETE USING (auth.role() = 'authenticated');

-- Affiliate Commissions Policies
CREATE POLICY "Enable read access for all users" ON public.affiliate_commissions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.affiliate_commissions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.affiliate_commissions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.affiliate_commissions FOR DELETE USING (auth.role() = 'authenticated');

-- Affiliate Payouts Policies
CREATE POLICY "Enable read access for all users" ON public.affiliate_payouts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.affiliate_payouts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.affiliate_payouts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.affiliate_payouts FOR DELETE USING (auth.role() = 'authenticated');

-- Affiliate Sessions Policies
CREATE POLICY "Enable read access for all users" ON public.affiliate_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.affiliate_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.affiliate_sessions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.affiliate_sessions FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert a sample affiliate user for testing
INSERT INTO public.affiliate_users (name, mobile_number, password_hash, affiliate_code, is_active) 
VALUES ('Test Affiliate', '9999999999', encode(digest('password123', 'sha256'), 'hex'), 'AFF000001', true);

-- Insert sample product affiliate settings (if products table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        INSERT INTO public.product_affiliate_settings (product_id, is_affiliate_enabled, commission_type, commission_value)
        SELECT id, false, 'percentage', 5.00
        FROM public.products 
        WHERE id NOT IN (SELECT product_id FROM public.product_affiliate_settings)
        LIMIT 10;
    END IF;
END $$;

-- =====================================================
-- TABLE COMMENTS
-- =====================================================

COMMENT ON TABLE public.affiliate_users IS 'Affiliate marketers managed by admin';
COMMENT ON TABLE public.product_affiliate_settings IS 'Per-product affiliate commission settings';
COMMENT ON TABLE public.affiliate_clicks IS 'Tracking affiliate link clicks';
COMMENT ON TABLE public.affiliate_orders IS 'Orders attributed to affiliates';
COMMENT ON TABLE public.affiliate_commissions IS 'Affiliate commission transactions';
COMMENT ON TABLE public.affiliate_payouts IS 'Affiliate payout requests and processing';
COMMENT ON TABLE public.affiliate_sessions IS 'Affiliate tracking sessions';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 AFFILIATE MARKETING SYSTEM SETUP COMPLETE!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Created 7 tables with proper structure';
    RAISE NOTICE '✅ Created 4 functions for affiliate operations';
    RAISE NOTICE '✅ Created 3 triggers for automatic stats updates';
    RAISE NOTICE '✅ Created performance indexes';
    RAISE NOTICE '✅ Enabled RLS policies for security';
    RAISE NOTICE '✅ Added sample data for testing';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your affiliate marketing system is ready!';
    RAISE NOTICE '📋 You can now:';
    RAISE NOTICE '   - Create affiliate users in admin panel';
    RAISE NOTICE '   - Set product commission rates';
    RAISE NOTICE '   - Track affiliate clicks and orders';
    RAISE NOTICE '   - Process affiliate payouts';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Sample affiliate login:';
    RAISE NOTICE '   Mobile: 9999999999';
    RAISE NOTICE '   Password: password123';
    RAISE NOTICE '   Code: AFF000001';
END $$;