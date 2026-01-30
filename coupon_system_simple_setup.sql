-- ============================================
-- 🎉 COUPON & PROMO CAMPAIGN MODULE - SIMPLE SETUP
-- ============================================

-- 1. Main Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    coupon_title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Discount Configuration
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('flat', 'percentage')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_discount_amount DECIMAL(10,2), -- For percentage coupons
    
    -- Applicability Rules
    min_order_value DECIMAL(10,2) DEFAULT 0,
    applicable_on VARCHAR(20) DEFAULT 'all' CHECK (applicable_on IN ('all', 'products', 'categories')),
    
    -- User Targeting
    is_user_specific BOOLEAN DEFAULT false,
    target_user_ids UUID[], -- Array of user IDs for specific targeting
    
    -- Affiliate Integration
    is_affiliate_specific BOOLEAN DEFAULT false,
    affiliate_id UUID,
    
    -- Loyalty Coins Integration
    coins_integration_type VARCHAR(20) DEFAULT 'none' CHECK (coins_integration_type IN ('none', 'earn_extra', 'purchasable', 'required')),
    bonus_coins_earned INTEGER DEFAULT 0, -- Extra coins for 'earn_extra' type
    coins_required_to_unlock INTEGER DEFAULT 0, -- Coins needed for 'purchasable' type
    min_coins_required INTEGER DEFAULT 0, -- Minimum coins user must have for 'required' type
    
    -- Expiry & Usage Control
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Usage Limits
    total_usage_limit INTEGER, -- NULL means unlimited
    per_user_usage_limit INTEGER DEFAULT 1,
    daily_usage_limit INTEGER, -- NULL means no daily limit
    
    -- Stacking Rules
    allow_stacking_with_coupons BOOLEAN DEFAULT false,
    allow_stacking_with_coins BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    
    -- Analytics
    total_usage_count INTEGER DEFAULT 0,
    total_discount_given DECIMAL(12,2) DEFAULT 0.00,
    total_revenue_generated DECIMAL(12,2) DEFAULT 0.00
);

-- 2. Coupon Product Mapping (for product-specific coupons)
CREATE TABLE IF NOT EXISTS public.coupon_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(coupon_id, product_id)
);

-- 3. Coupon Category Mapping (for category-specific coupons)
CREATE TABLE IF NOT EXISTS public.coupon_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(coupon_id, category_name)
);

-- 4. Coupon Usage History
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL,
    user_id UUID,
    order_id UUID,
    
    -- Usage Details
    discount_amount DECIMAL(10,2) NOT NULL,
    order_total DECIMAL(10,2) NOT NULL,
    coins_used INTEGER DEFAULT 0,
    bonus_coins_earned INTEGER DEFAULT 0,
    
    -- Tracking
    user_session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    affiliate_id UUID,
    
    -- Status
    status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'refunded', 'cancelled')),
    
    -- Timestamps
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    refunded_at TIMESTAMP WITH TIME ZONE
);

-- 5. User Coupon Assignments (for user-specific coupons)
CREATE TABLE IF NOT EXISTS public.user_coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    coupon_id UUID NOT NULL,
    
    -- Assignment Details
    assigned_by UUID,
    assignment_reason TEXT,
    
    -- Usage Tracking
    is_used BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, coupon_id)
);

-- 6. Coupon Analytics Daily Summary
CREATE TABLE IF NOT EXISTS public.coupon_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL,
    date DATE NOT NULL,
    
    -- Daily Metrics
    usage_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    total_discount_given DECIMAL(12,2) DEFAULT 0.00,
    total_order_value DECIMAL(12,2) DEFAULT 0.00,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Affiliate Metrics (if applicable)
    affiliate_usage_count INTEGER DEFAULT 0,
    affiliate_conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(coupon_id, date)
);

-- Add coupon columns to existing orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon_id UUID,
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS coupon_discount_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS coupon_bonus_coins INTEGER DEFAULT 0;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_dates ON public.coupons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_coupons_affiliate ON public.coupons(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_coupons_user_specific ON public.coupons(is_user_specific);

CREATE INDEX IF NOT EXISTS idx_coupon_products_coupon ON public.coupon_products(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_products_product ON public.coupon_products(product_id);

CREATE INDEX IF NOT EXISTS idx_coupon_categories_coupon ON public.coupon_categories(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_categories_category ON public.coupon_categories(category_name);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order ON public.coupon_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_date ON public.coupon_usage(used_at);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_affiliate ON public.coupon_usage(affiliate_id);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user ON public.user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon ON public.user_coupons(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_used ON public.user_coupons(is_used);

CREATE INDEX IF NOT EXISTS idx_coupon_analytics_coupon ON public.coupon_analytics(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_analytics_date ON public.coupon_analytics(date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all coupon tables
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_analytics ENABLE ROW LEVEL SECURITY;

-- Coupons Policies
CREATE POLICY "Public can view active coupons" ON public.coupons
    FOR SELECT USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can manage all coupons" ON public.coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Coupon Products Policies
CREATE POLICY "Public can view coupon products" ON public.coupon_products
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage coupon products" ON public.coupon_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Coupon Categories Policies
CREATE POLICY "Public can view coupon categories" ON public.coupon_categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage coupon categories" ON public.coupon_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Coupon Usage Policies
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert coupon usage" ON public.coupon_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all coupon usage" ON public.coupon_usage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- User Coupons Policies
CREATE POLICY "Users can view own assigned coupons" ON public.user_coupons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user coupon assignments" ON public.user_coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Coupon Analytics Policies
CREATE POLICY "Admins can view coupon analytics" ON public.coupon_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample coupons
INSERT INTO public.coupons (
    coupon_code, coupon_title, description, discount_type, discount_value,
    min_order_value, start_date, end_date, per_user_usage_limit
) VALUES 
(
    'WELCOME50', 'Welcome Discount', 'Get ₹50 off on your first order',
    'flat', 50.00, 500.00, now(), now() + interval '30 days', 1
),
(
    'SAVE20', '20% Off Everything', 'Save 20% on all products',
    'percentage', 20.00, 1000.00, now(), now() + interval '7 days', 3
),
(
    'DIWALI25', 'Diwali Special', 'Celebrate with 25% off + bonus coins',
    'percentage', 25.00, 2000.00, now(), now() + interval '15 days', 2
) ON CONFLICT (coupon_code) DO NOTHING;

-- Update the Diwali coupon to include bonus coins
UPDATE public.coupons 
SET 
    coins_integration_type = 'earn_extra',
    bonus_coins_earned = 100
WHERE coupon_code = 'DIWALI25';

COMMENT ON TABLE public.coupons IS 'Main coupon configuration and management';
COMMENT ON TABLE public.coupon_usage IS 'Tracks all coupon usage and redemptions';
COMMENT ON TABLE public.user_coupons IS 'User-specific coupon assignments';
COMMENT ON TABLE public.coupon_analytics IS 'Daily analytics and reporting for coupons';