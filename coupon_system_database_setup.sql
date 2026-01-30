-- ============================================
-- 🎉 COUPON & PROMO CAMPAIGN MODULE - DATABASE SETUP
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
    affiliate_id UUID REFERENCES public.affiliate_users(id) ON DELETE SET NULL,
    
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
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Analytics
    total_usage_count INTEGER DEFAULT 0,
    total_discount_given DECIMAL(12,2) DEFAULT 0.00,
    total_revenue_generated DECIMAL(12,2) DEFAULT 0.00
);

-- 2. Coupon Product Mapping (for product-specific coupons)
CREATE TABLE IF NOT EXISTS public.coupon_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(coupon_id, product_id)
);

-- 3. Coupon Category Mapping (for category-specific coupons)
CREATE TABLE IF NOT EXISTS public.coupon_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    category_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(coupon_id, category_name)
);

-- 4. Coupon Usage History
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    -- Usage Details
    discount_amount DECIMAL(10,2) NOT NULL,
    order_total DECIMAL(10,2) NOT NULL,
    coins_used INTEGER DEFAULT 0,
    bonus_coins_earned INTEGER DEFAULT 0,
    
    -- Tracking
    user_session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    affiliate_id UUID REFERENCES public.affiliate_users(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'refunded', 'cancelled')),
    
    -- Timestamps
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    refunded_at TIMESTAMP WITH TIME ZONE
);

-- 5. User Coupon Assignments (for user-specific coupons)
CREATE TABLE IF NOT EXISTS public.user_coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    
    -- Assignment Details
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
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
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
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
-- UTILITY FUNCTIONS
-- ============================================

-- Function to generate unique coupon code
CREATE OR REPLACE FUNCTION generate_coupon_code(prefix TEXT DEFAULT 'SAVE')
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        code := prefix || LPAD(floor(random() * 999999)::TEXT, 6, '0');
        SELECT COUNT(*) INTO exists_check FROM public.coupons WHERE coupon_code = code;
        EXIT WHEN exists_check = 0;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to validate coupon eligibility
CREATE OR REPLACE FUNCTION validate_coupon_eligibility(
    p_coupon_code TEXT,
    p_user_id UUID,
    p_order_total DECIMAL,
    p_cart_items JSONB,
    p_affiliate_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    coupon_record RECORD;
    user_usage_count INTEGER;
    daily_usage_count INTEGER;
    result JSONB;
BEGIN
    -- Get coupon details
    SELECT * INTO coupon_record 
    FROM public.coupons 
    WHERE coupon_code = p_coupon_code AND is_active = true;
    
    -- Check if coupon exists
    IF coupon_record IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invalid coupon code');
    END IF;
    
    -- Check expiry dates
    IF coupon_record.start_date > now() THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Coupon not yet active');
    END IF;
    
    IF coupon_record.end_date IS NOT NULL AND coupon_record.end_date < now() THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Coupon has expired');
    END IF;
    
    -- Check minimum order value
    IF p_order_total < coupon_record.min_order_value THEN
        RETURN jsonb_build_object('valid', false, 'error', 
            'Minimum order value of ₹' || coupon_record.min_order_value || ' required');
    END IF;
    
    -- Check user-specific coupon
    IF coupon_record.is_user_specific THEN
        IF NOT (p_user_id = ANY(coupon_record.target_user_ids)) THEN
            -- Check if user has been assigned this coupon
            IF NOT EXISTS (
                SELECT 1 FROM public.user_coupons 
                WHERE user_id = p_user_id AND coupon_id = coupon_record.id
            ) THEN
                RETURN jsonb_build_object('valid', false, 'error', 'This coupon is not available for you');
            END IF;
        END IF;
    END IF;
    
    -- Check affiliate-specific coupon
    IF coupon_record.is_affiliate_specific THEN
        IF p_affiliate_id IS NULL OR p_affiliate_id != coupon_record.affiliate_id THEN
            RETURN jsonb_build_object('valid', false, 'error', 'This coupon is only valid for specific affiliate links');
        END IF;
    END IF;
    
    -- Check user usage limit
    SELECT COUNT(*) INTO user_usage_count
    FROM public.coupon_usage
    WHERE coupon_id = coupon_record.id AND user_id = p_user_id AND status = 'applied';
    
    IF user_usage_count >= coupon_record.per_user_usage_limit THEN
        RETURN jsonb_build_object('valid', false, 'error', 'You have already used this coupon');
    END IF;
    
    -- Check total usage limit
    IF coupon_record.total_usage_limit IS NOT NULL AND 
       coupon_record.total_usage_count >= coupon_record.total_usage_limit THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Coupon usage limit exceeded');
    END IF;
    
    -- Check daily usage limit
    IF coupon_record.daily_usage_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO daily_usage_count
        FROM public.coupon_usage
        WHERE coupon_id = coupon_record.id 
        AND DATE(used_at) = CURRENT_DATE 
        AND status = 'applied';
        
        IF daily_usage_count >= coupon_record.daily_usage_limit THEN
            RETURN jsonb_build_object('valid', false, 'error', 'Daily usage limit for this coupon exceeded');
        END IF;
    END IF;
    
    -- Check loyalty coins requirement
    IF coupon_record.coins_integration_type = 'required' THEN
        DECLARE
            user_coins INTEGER;
        BEGIN
            SELECT available_coins INTO user_coins
            FROM public.loyalty_coins_wallet
            WHERE user_id = p_user_id;
            
            IF COALESCE(user_coins, 0) < coupon_record.min_coins_required THEN
                RETURN jsonb_build_object('valid', false, 'error', 
                    'You need at least ' || coupon_record.min_coins_required || ' coins to use this coupon');
            END IF;
        END;
    END IF;
    
    -- Calculate discount amount
    DECLARE
        discount_amount DECIMAL(10,2);
    BEGIN
        IF coupon_record.discount_type = 'flat' THEN
            discount_amount := LEAST(coupon_record.discount_value, p_order_total);
        ELSE -- percentage
            discount_amount := (p_order_total * coupon_record.discount_value) / 100;
            IF coupon_record.max_discount_amount IS NOT NULL THEN
                discount_amount := LEAST(discount_amount, coupon_record.max_discount_amount);
            END IF;
        END IF;
        
        -- Return success with discount details
        RETURN jsonb_build_object(
            'valid', true,
            'coupon_id', coupon_record.id,
            'discount_amount', discount_amount,
            'bonus_coins', coupon_record.bonus_coins_earned,
            'coupon_title', coupon_record.coupon_title,
            'description', coupon_record.description
        );
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to apply coupon to order
CREATE OR REPLACE FUNCTION apply_coupon_to_order(
    p_coupon_code TEXT,
    p_user_id UUID,
    p_order_id UUID,
    p_order_total DECIMAL,
    p_affiliate_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    coupon_record RECORD;
    discount_amount DECIMAL(10,2);
    usage_record_id UUID;
BEGIN
    -- Validate coupon first
    DECLARE
        validation_result JSONB;
    BEGIN
        validation_result := validate_coupon_eligibility(
            p_coupon_code, p_user_id, p_order_total, '[]'::jsonb, p_affiliate_id
        );
        
        IF NOT (validation_result->>'valid')::boolean THEN
            RETURN validation_result;
        END IF;
        
        discount_amount := (validation_result->>'discount_amount')::decimal;
    END;
    
    -- Get coupon record
    SELECT * INTO coupon_record 
    FROM public.coupons 
    WHERE coupon_code = p_coupon_code;
    
    -- Insert usage record
    INSERT INTO public.coupon_usage (
        coupon_id, user_id, order_id, discount_amount, order_total,
        bonus_coins_earned, affiliate_id, status
    ) VALUES (
        coupon_record.id, p_user_id, p_order_id, discount_amount, p_order_total,
        coupon_record.bonus_coins_earned, p_affiliate_id, 'applied'
    ) RETURNING id INTO usage_record_id;
    
    -- Update coupon statistics
    UPDATE public.coupons 
    SET 
        total_usage_count = total_usage_count + 1,
        total_discount_given = total_discount_given + discount_amount,
        total_revenue_generated = total_revenue_generated + (p_order_total - discount_amount),
        updated_at = now()
    WHERE id = coupon_record.id;
    
    -- Update user coupon if it's user-specific
    IF coupon_record.is_user_specific THEN
        UPDATE public.user_coupons 
        SET is_used = true, usage_count = usage_count + 1
        WHERE user_id = p_user_id AND coupon_id = coupon_record.id;
    END IF;
    
    -- Award bonus coins if applicable
    IF coupon_record.bonus_coins_earned > 0 THEN
        -- Add loyalty transaction
        INSERT INTO public.loyalty_transactions (
            user_id, transaction_type, coins_amount, reference_type, 
            reference_id, order_id, description
        ) VALUES (
            p_user_id, 'earned', coupon_record.bonus_coins_earned, 'coupon_bonus',
            coupon_record.id, p_order_id, 
            'Bonus coins from coupon: ' || p_coupon_code
        );
        
        -- Update user wallet
        PERFORM update_user_coin_wallet(p_user_id, coupon_record.bonus_coins_earned, 'earned');
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'usage_id', usage_record_id,
        'discount_amount', discount_amount,
        'bonus_coins', coupon_record.bonus_coins_earned
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_coupon_analytics()
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.coupon_analytics (
        coupon_id, date, usage_count, unique_users, 
        total_discount_given, total_order_value
    )
    SELECT 
        cu.coupon_id,
        CURRENT_DATE,
        COUNT(*) as usage_count,
        COUNT(DISTINCT cu.user_id) as unique_users,
        SUM(cu.discount_amount) as total_discount_given,
        SUM(cu.order_total) as total_order_value
    FROM public.coupon_usage cu
    WHERE DATE(cu.used_at) = CURRENT_DATE
    AND cu.status = 'applied'
    GROUP BY cu.coupon_id
    ON CONFLICT (coupon_id, date) DO UPDATE SET
        usage_count = EXCLUDED.usage_count,
        unique_users = EXCLUDED.unique_users,
        total_discount_given = EXCLUDED.total_discount_given,
        total_order_value = EXCLUDED.total_order_value;
END;
$$ LANGUAGE plpgsql;

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
);

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