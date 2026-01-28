-- =============================================
-- AFFILIATE MARKETING SYSTEM DATABASE SCHEMA
-- =============================================

-- Create profiles table for user roles and basic info
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'affiliate', 'customer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliates table for affiliate-specific data
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('fixed', 'percentage')),
    commission_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    total_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_commission DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_orders INTEGER NOT NULL DEFAULT 0,
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create affiliate_coupons table
CREATE TABLE IF NOT EXISTS public.affiliate_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    coupon_code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER DEFAULT NULL, -- NULL means unlimited
    used_count INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update orders table to include affiliate tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_type TEXT,
ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10,2) DEFAULT 0.00;

-- Create affiliate_commissions table
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    order_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(order_id)
);

-- Create affiliate_targets table for monthly targets
CREATE TABLE IF NOT EXISTS public.affiliate_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
    target_sales_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    target_orders INTEGER NOT NULL DEFAULT 0,
    achieved_sales_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    achieved_orders INTEGER NOT NULL DEFAULT 0,
    reward_type TEXT CHECK (reward_type IN ('cash', 'gift', 'bonus', 'coupon')),
    reward_value DECIMAL(10,2) DEFAULT 0.00,
    reward_description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(affiliate_id, month_year)
);

-- Create affiliate_rewards table
CREATE TABLE IF NOT EXISTS public.affiliate_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.affiliate_targets(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('cash', 'gift', 'bonus', 'coupon')),
    reward_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    reward_description TEXT,
    reward_status TEXT NOT NULL DEFAULT 'unlocked' CHECK (reward_status IN ('locked', 'unlocked', 'claimed', 'paid')),
    claimed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_payouts table for tracking payments
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    payout_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_ids UUID[] NOT NULL, -- Array of commission IDs included in this payout
    reward_ids UUID[], -- Array of reward IDs included in this payout
    payout_method TEXT NOT NULL DEFAULT 'bank_transfer',
    payout_details JSONB, -- Bank details, UPI ID, etc.
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_at TIMESTAMP WITH TIME ZONE,
    transaction_id TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_clicks table for tracking coupon usage
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    coupon_code TEXT NOT NULL,
    customer_ip TEXT,
    user_agent TEXT,
    referrer_url TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    converted BOOLEAN NOT NULL DEFAULT false,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL
);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_coupons_updated_at BEFORE UPDATE ON public.affiliate_coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_commissions_updated_at BEFORE UPDATE ON public.affiliate_commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_targets_updated_at BEFORE UPDATE ON public.affiliate_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_rewards_updated_at BEFORE UPDATE ON public.affiliate_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_payouts_updated_at BEFORE UPDATE ON public.affiliate_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate commission amount
CREATE OR REPLACE FUNCTION calculate_commission(
    affiliate_id_param UUID,
    order_amount DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    commission_type TEXT;
    commission_value DECIMAL(10,2);
    calculated_commission DECIMAL(10,2);
BEGIN
    -- Get affiliate commission settings
    SELECT a.commission_type, a.commission_value 
    INTO commission_type, commission_value
    FROM public.affiliates a 
    WHERE a.id = affiliate_id_param;
    
    -- Calculate commission based on type
    IF commission_type = 'percentage' THEN
        calculated_commission := (order_amount * commission_value) / 100;
    ELSE
        calculated_commission := commission_value;
    END IF;
    
    RETURN COALESCE(calculated_commission, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Function to create commission record when order is placed
CREATE OR REPLACE FUNCTION create_affiliate_commission()
RETURNS TRIGGER AS $$
DECLARE
    commission_amount DECIMAL(10,2);
    commission_rate DECIMAL(5,2);
BEGIN
    -- Only create commission if order has affiliate_id and is completed
    IF NEW.affiliate_id IS NOT NULL AND NEW.status = 'completed' THEN
        -- Get commission rate
        SELECT a.commission_value INTO commission_rate
        FROM public.affiliates a 
        WHERE a.id = NEW.affiliate_id;
        
        -- Calculate commission
        commission_amount := calculate_commission(NEW.affiliate_id, NEW.total_amount);
        
        -- Insert commission record
        INSERT INTO public.affiliate_commissions (
            affiliate_id, 
            order_id, 
            commission_amount, 
            commission_rate, 
            order_amount,
            status
        ) VALUES (
            NEW.affiliate_id, 
            NEW.id, 
            commission_amount, 
            commission_rate, 
            NEW.total_amount,
            'pending'
        ) ON CONFLICT (order_id) DO UPDATE SET
            commission_amount = EXCLUDED.commission_amount,
            commission_rate = EXCLUDED.commission_rate,
            order_amount = EXCLUDED.order_amount,
            updated_at = now();
        
        -- Update affiliate totals
        UPDATE public.affiliates 
        SET 
            total_sales = total_sales + NEW.total_amount,
            total_commission = total_commission + commission_amount,
            total_orders = total_orders + 1,
            updated_at = now()
        WHERE id = NEW.affiliate_id;
        
        -- Update target progress
        UPDATE public.affiliate_targets 
        SET 
            achieved_sales_amount = achieved_sales_amount + NEW.total_amount,
            achieved_orders = achieved_orders + 1,
            status = CASE 
                WHEN (achieved_sales_amount + NEW.total_amount) >= target_sales_amount 
                     AND (achieved_orders + 1) >= target_orders 
                THEN 'achieved' 
                ELSE status 
            END,
            updated_at = now()
        WHERE affiliate_id = NEW.affiliate_id 
        AND month_year = TO_CHAR(NEW.created_at, 'YYYY-MM');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create commission when order status changes to completed
CREATE TRIGGER create_commission_on_order_completion
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION create_affiliate_commission();

-- Function to validate coupon and apply discount
CREATE OR REPLACE FUNCTION validate_and_apply_coupon(
    coupon_code_param TEXT,
    order_amount DECIMAL(10,2)
) RETURNS TABLE (
    is_valid BOOLEAN,
    discount_amount DECIMAL(10,2),
    discount_type TEXT,
    affiliate_id UUID,
    error_message TEXT
) AS $$
DECLARE
    coupon_record RECORD;
    calculated_discount DECIMAL(10,2) := 0.00;
BEGIN
    -- Get coupon details
    SELECT ac.*, a.id as aff_id, a.status as aff_status
    INTO coupon_record
    FROM public.affiliate_coupons ac
    JOIN public.affiliates a ON ac.affiliate_id = a.id
    WHERE ac.coupon_code = coupon_code_param;
    
    -- Check if coupon exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, 'Invalid coupon code'::TEXT;
        RETURN;
    END IF;
    
    -- Check if coupon is active
    IF NOT coupon_record.is_active THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, 'Coupon is not active'::TEXT;
        RETURN;
    END IF;
    
    -- Check if affiliate is active
    IF coupon_record.aff_status != 'active' THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, 'Affiliate account is not active'::TEXT;
        RETURN;
    END IF;
    
    -- Check expiry date
    IF coupon_record.expiry_date IS NOT NULL AND coupon_record.expiry_date < CURRENT_DATE THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, 'Coupon has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check usage limit
    IF coupon_record.usage_limit IS NOT NULL AND coupon_record.used_count >= coupon_record.usage_limit THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, 'Coupon usage limit exceeded'::TEXT;
        RETURN;
    END IF;
    
    -- Check minimum order amount
    IF coupon_record.min_order_amount > 0 AND order_amount < coupon_record.min_order_amount THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, 
            'Minimum order amount of ₹' || coupon_record.min_order_amount || ' required'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate discount
    IF coupon_record.discount_type = 'percentage' THEN
        calculated_discount := (order_amount * coupon_record.discount_value) / 100;
        -- Apply max discount limit if set
        IF coupon_record.max_discount_amount IS NOT NULL AND calculated_discount > coupon_record.max_discount_amount THEN
            calculated_discount := coupon_record.max_discount_amount;
        END IF;
    ELSE
        calculated_discount := coupon_record.discount_value;
    END IF;
    
    -- Ensure discount doesn't exceed order amount
    IF calculated_discount > order_amount THEN
        calculated_discount := order_amount;
    END IF;
    
    RETURN QUERY SELECT true, calculated_discount, coupon_record.discount_type, coupon_record.aff_id, ''::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Affiliates policies
CREATE POLICY "Affiliates can view own data" ON public.affiliates
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage affiliates" ON public.affiliates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Affiliate coupons policies
CREATE POLICY "Affiliates can view own coupons" ON public.affiliate_coupons
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM public.affiliates WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all coupons" ON public.affiliate_coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Public read access for coupon validation (needed for order processing)
CREATE POLICY "Public can read active coupons for validation" ON public.affiliate_coupons
    FOR SELECT USING (is_active = true);

-- Affiliate commissions policies
CREATE POLICY "Affiliates can view own commissions" ON public.affiliate_commissions
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM public.affiliates WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all commissions" ON public.affiliate_commissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Affiliate targets policies
CREATE POLICY "Affiliates can view own targets" ON public.affiliate_targets
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM public.affiliates WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all targets" ON public.affiliate_targets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Affiliate rewards policies
CREATE POLICY "Affiliates can view own rewards" ON public.affiliate_rewards
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM public.affiliates WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all rewards" ON public.affiliate_rewards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Affiliate payouts policies
CREATE POLICY "Affiliates can view own payouts" ON public.affiliate_payouts
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM public.affiliates WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all payouts" ON public.affiliate_payouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Affiliate clicks policies (for analytics)
CREATE POLICY "Affiliates can view own clicks" ON public.affiliate_clicks
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM public.affiliates WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Public can insert clicks" ON public.affiliate_clicks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all clicks" ON public.affiliate_clicks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert admin profile (update email as needed)
INSERT INTO public.profiles (id, email, role, full_name, status)
SELECT id, email, 'admin', 'System Admin', 'active'
FROM auth.users 
WHERE email = 'chamundam289@gmail.com'
ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = now();

-- Create some sample expense categories for affiliate management
INSERT INTO public.expense_categories (name, description) VALUES
('Affiliate Commissions', 'Commission payments to affiliate marketers'),
('Affiliate Rewards', 'Reward payments for achieving targets'),
('Marketing Expenses', 'General marketing and promotional expenses')
ON CONFLICT DO NOTHING; 

-- =============================================
-- HELPER FUNCTIONS FOR AFFILIATE DASHBOARD
-- =============================================

-- Function to get profile by user ID
CREATE OR REPLACE FUNCTION get_profile_by_id(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    status TEXT,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.role, p.status, p.full_name, p.phone, p.created_at, p.updated_at
    FROM public.profiles p
    WHERE p.id = user_id_param;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create profile
CREATE OR REPLACE FUNCTION create_profile(
    user_id_param UUID,
    email_param TEXT,
    role_param TEXT DEFAULT 'customer'
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    status TEXT,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    INSERT INTO public.profiles (id, email, role, status)
    VALUES (user_id_param, email_param, role_param, 'active')
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = now();
    
    RETURN QUERY
    SELECT p.id, p.email, p.role, p.status, p.full_name, p.phone, p.created_at, p.updated_at
    FROM public.profiles p
    WHERE p.id = user_id_param;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure admin profile exists
CREATE OR REPLACE FUNCTION ensure_admin_profile(
    user_id_param UUID,
    email_param TEXT
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    status TEXT,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    INSERT INTO public.profiles (id, email, role, status)
    VALUES (user_id_param, email_param, 'admin', 'active')
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        status = 'active',
        email = EXCLUDED.email,
        updated_at = now();
    
    RETURN QUERY
    SELECT p.id, p.email, p.role, p.status, p.full_name, p.phone, p.created_at, p.updated_at
    FROM public.profiles p
    WHERE p.id = user_id_param;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get affiliate by user ID
CREATE OR REPLACE FUNCTION get_affiliate_by_user_id(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    commission_type TEXT,
    commission_value DECIMAL(10,2),
    status TEXT,
    total_sales DECIMAL(12,2),
    total_commission DECIMAL(12,2),
    total_orders INTEGER,
    joined_date DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.user_id, a.commission_type, a.commission_value, a.status,
           a.total_sales, a.total_commission, a.total_orders, a.joined_date,
           a.created_at, a.updated_at
    FROM public.affiliates a
    WHERE a.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get affiliate target for specific month
CREATE OR REPLACE FUNCTION get_affiliate_target(
    affiliate_id_param UUID,
    month_year_param TEXT
)
RETURNS TABLE (
    id UUID,
    affiliate_id UUID,
    month_year TEXT,
    target_sales_amount DECIMAL(12,2),
    target_orders INTEGER,
    achieved_sales_amount DECIMAL(12,2),
    achieved_orders INTEGER,
    reward_type TEXT,
    reward_value DECIMAL(10,2),
    reward_description TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.affiliate_id, t.month_year, t.target_sales_amount, t.target_orders,
           t.achieved_sales_amount, t.achieved_orders, t.reward_type, t.reward_value,
           t.reward_description, t.status
    FROM public.affiliate_targets t
    WHERE t.affiliate_id = affiliate_id_param AND t.month_year = month_year_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get affiliate commissions by status
CREATE OR REPLACE FUNCTION get_affiliate_commissions(
    affiliate_id_param UUID,
    status_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    affiliate_id UUID,
    order_id UUID,
    commission_amount DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    order_amount DECIMAL(10,2),
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    IF status_param IS NULL THEN
        RETURN QUERY
        SELECT c.id, c.affiliate_id, c.order_id, c.commission_amount, c.commission_rate,
               c.order_amount, c.status, c.created_at
        FROM public.affiliate_commissions c
        WHERE c.affiliate_id = affiliate_id_param
        ORDER BY c.created_at DESC;
    ELSE
        RETURN QUERY
        SELECT c.id, c.affiliate_id, c.order_id, c.commission_amount, c.commission_rate,
               c.order_amount, c.status, c.created_at
        FROM public.affiliate_commissions c
        WHERE c.affiliate_id = affiliate_id_param AND c.status = status_param
        ORDER BY c.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get affiliate commissions with order details
CREATE OR REPLACE FUNCTION get_affiliate_commissions_with_orders(
    affiliate_id_param UUID,
    limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    affiliate_id UUID,
    order_id UUID,
    commission_amount DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    order_amount DECIMAL(10,2),
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    invoice_number TEXT,
    customer_name TEXT,
    order_total_amount DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.affiliate_id, c.order_id, c.commission_amount, c.commission_rate,
           c.order_amount, c.status, c.created_at,
           o.invoice_number, o.customer_name, o.total_amount
    FROM public.affiliate_commissions c
    LEFT JOIN public.orders o ON c.order_id = o.id
    WHERE c.affiliate_id = affiliate_id_param
    ORDER BY c.created_at DESC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get affiliate coupons
CREATE OR REPLACE FUNCTION get_affiliate_coupons(affiliate_id_param UUID)
RETURNS TABLE (
    id UUID,
    affiliate_id UUID,
    coupon_code TEXT,
    discount_type TEXT,
    discount_value DECIMAL(10,2),
    min_order_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER,
    expiry_date DATE,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT ac.id, ac.affiliate_id, ac.coupon_code, ac.discount_type, ac.discount_value,
           ac.min_order_amount, ac.max_discount_amount, ac.usage_limit, ac.used_count,
           ac.expiry_date, ac.is_active, ac.created_at, ac.updated_at
    FROM public.affiliate_coupons ac
    WHERE ac.affiliate_id = affiliate_id_param
    ORDER BY ac.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count affiliate coupons
CREATE OR REPLACE FUNCTION get_affiliate_coupons_count(
    affiliate_id_param UUID,
    active_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (count BIGINT) AS $$
BEGIN
    IF active_only THEN
        RETURN QUERY
        SELECT COUNT(*) FROM public.affiliate_coupons
        WHERE affiliate_id = affiliate_id_param AND is_active = TRUE;
    ELSE
        RETURN QUERY
        SELECT COUNT(*) FROM public.affiliate_coupons
        WHERE affiliate_id = affiliate_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get affiliate targets
CREATE OR REPLACE FUNCTION get_affiliate_targets(affiliate_id_param UUID)
RETURNS TABLE (
    id UUID,
    affiliate_id UUID,
    month_year TEXT,
    target_sales_amount DECIMAL(12,2),
    target_orders INTEGER,
    achieved_sales_amount DECIMAL(12,2),
    achieved_orders INTEGER,
    reward_type TEXT,
    reward_value DECIMAL(10,2),
    reward_description TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.affiliate_id, t.month_year, t.target_sales_amount, t.target_orders,
           t.achieved_sales_amount, t.achieved_orders, t.reward_type, t.reward_value,
           t.reward_description, t.status, t.created_at, t.updated_at
    FROM public.affiliate_targets t
    WHERE t.affiliate_id = affiliate_id_param
    ORDER BY t.month_year DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get affiliate rewards with target details
CREATE OR REPLACE FUNCTION get_affiliate_rewards_with_targets(affiliate_id_param UUID)
RETURNS TABLE (
    id UUID,
    affiliate_id UUID,
    target_id UUID,
    reward_type TEXT,
    reward_value DECIMAL(10,2),
    reward_description TEXT,
    reward_status TEXT,
    claimed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    target_month_year TEXT,
    target_sales_amount DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.affiliate_id, r.target_id, r.reward_type, r.reward_value,
           r.reward_description, r.reward_status, r.claimed_at, r.paid_at, r.created_at,
           t.month_year, t.target_sales_amount
    FROM public.affiliate_rewards r
    LEFT JOIN public.affiliate_targets t ON r.target_id = t.id
    WHERE r.affiliate_id = affiliate_id_param
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count affiliate rewards by status
CREATE OR REPLACE FUNCTION get_affiliate_rewards_count(
    affiliate_id_param UUID,
    status_filter TEXT DEFAULT NULL
)
RETURNS TABLE (count BIGINT) AS $$
BEGIN
    IF status_filter IS NULL THEN
        RETURN QUERY
        SELECT COUNT(*) FROM public.affiliate_rewards
        WHERE affiliate_id = affiliate_id_param;
    ELSE
        RETURN QUERY
        SELECT COUNT(*) FROM public.affiliate_rewards
        WHERE affiliate_id = affiliate_id_param AND reward_status = status_filter;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;