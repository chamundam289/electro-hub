-- Affiliate Marketing System Database Setup (SIMPLE VERSION - NO RLS)
-- Complete database structure for affiliate marketing with manual admin control

-- 1. Affiliate Users Table
CREATE TABLE IF NOT EXISTS public.affiliate_users (
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

-- 2. Product Affiliate Settings Table (extends products)
CREATE TABLE IF NOT EXISTS public.product_affiliate_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    is_affiliate_enabled BOOLEAN DEFAULT false,
    commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('fixed', 'percentage')),
    commission_value DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id)
);

-- 3. Affiliate Clicks Table
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL,
    product_id UUID NOT NULL,
    user_session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    converted_to_order BOOLEAN DEFAULT false,
    order_id UUID
);

-- 4. Affiliate Orders Table
CREATE TABLE IF NOT EXISTS public.affiliate_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL,
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    click_id UUID,
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

-- 5. Affiliate Commissions Table (wallet/ledger)
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL,
    order_id UUID,
    affiliate_order_id UUID,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'reversed', 'paid')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 6. Affiliate Payouts Table
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL,
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

-- 7. Affiliate Sessions Table (for tracking)
CREATE TABLE IF NOT EXISTS public.affiliate_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    affiliate_id UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_users_mobile ON public.affiliate_users(mobile_number);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_code ON public.affiliate_users(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_active ON public.affiliate_users(is_active);

CREATE INDEX IF NOT EXISTS idx_product_affiliate_settings_product ON public.product_affiliate_settings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_affiliate_settings_enabled ON public.product_affiliate_settings(is_affiliate_enabled);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON public.affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product ON public.affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_session ON public.affiliate_clicks(user_session_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON public.affiliate_clicks(clicked_at);

CREATE INDEX IF NOT EXISTS idx_affiliate_orders_affiliate ON public.affiliate_orders(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_orders_order ON public.affiliate_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_orders_status ON public.affiliate_orders(status);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_type ON public.affiliate_commissions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON public.affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON public.affiliate_payouts(status);

CREATE INDEX IF NOT EXISTS idx_affiliate_sessions_session ON public.affiliate_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_sessions_affiliate ON public.affiliate_sessions(affiliate_id);

-- Functions for affiliate system

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code()
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
CREATE OR REPLACE FUNCTION calculate_affiliate_commission(
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
CREATE OR REPLACE FUNCTION update_affiliate_stats(p_affiliate_id UUID)
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

-- Trigger to auto-update affiliate stats
CREATE OR REPLACE FUNCTION trigger_update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_affiliate_stats(NEW.affiliate_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_affiliate_stats(OLD.affiliate_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_affiliate_clicks_stats ON public.affiliate_clicks;
CREATE TRIGGER trigger_affiliate_clicks_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.affiliate_clicks
    FOR EACH ROW EXECUTE FUNCTION trigger_update_affiliate_stats();

DROP TRIGGER IF EXISTS trigger_affiliate_orders_stats ON public.affiliate_orders;
CREATE TRIGGER trigger_affiliate_orders_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.affiliate_orders
    FOR EACH ROW EXECUTE FUNCTION trigger_update_affiliate_stats();

DROP TRIGGER IF EXISTS trigger_affiliate_commissions_stats ON public.affiliate_commissions;
CREATE TRIGGER trigger_affiliate_commissions_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.affiliate_commissions
    FOR EACH ROW EXECUTE FUNCTION trigger_update_affiliate_stats();

-- Add helpful comments
COMMENT ON TABLE public.affiliate_users IS 'Affiliate marketers managed by admin';
COMMENT ON TABLE public.product_affiliate_settings IS 'Per-product affiliate commission settings';
COMMENT ON TABLE public.affiliate_clicks IS 'Tracking affiliate link clicks';
COMMENT ON TABLE public.affiliate_orders IS 'Orders attributed to affiliates';
COMMENT ON TABLE public.affiliate_commissions IS 'Affiliate commission transactions';
COMMENT ON TABLE public.affiliate_payouts IS 'Affiliate payout requests and processing';
COMMENT ON TABLE public.affiliate_sessions IS 'Affiliate tracking sessions';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Affiliate Marketing System Database Setup Complete! (Simple Version)';
    RAISE NOTICE '📋 Created 7 tables with proper indexes (NO RLS policies for easier testing)';
    RAISE NOTICE '🔧 Created 4 functions for affiliate operations';
    RAISE NOTICE '⚡ Created 3 triggers for automatic stats updates';
    RAISE NOTICE '🚀 System is ready for affiliate marketing operations';
    RAISE NOTICE '⚠️  Remember to add RLS policies for production use';
END $$;