-- NEW AFFILIATE SYSTEM V2 - Complete Fresh Start
-- Uses different table names to avoid all conflicts

-- Update products table to include commission settings
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS affiliate_commission_type TEXT DEFAULT 'percentage' CHECK (affiliate_commission_type IN ('fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS affiliate_commission_value DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN DEFAULT false;

-- Create new affiliate_users table (different name to avoid conflicts)
CREATE TABLE IF NOT EXISTS public.affiliate_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_earnings table to track sales
CREATE TABLE IF NOT EXISTS public.affiliate_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_price DECIMAL(10,2) NOT NULL,
    commission_type TEXT NOT NULL,
    commission_value DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_discount_codes table (different name)
CREATE TABLE IF NOT EXISTS public.affiliate_discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE, -- NULL means all products
    coupon_code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    usage_limit INTEGER DEFAULT NULL,
    used_count INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.affiliate_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_discount_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliate_users
CREATE POLICY "admin_manage_affiliate_users" ON public.affiliate_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "affiliate_view_own_account" ON public.affiliate_users
    FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for affiliate_earnings
CREATE POLICY "admin_manage_all_earnings" ON public.affiliate_earnings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "affiliate_view_own_earnings" ON public.affiliate_earnings
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM public.affiliate_users 
            WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- RLS Policies for affiliate_discount_codes
CREATE POLICY "admin_manage_discount_codes" ON public.affiliate_discount_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "affiliate_view_own_codes" ON public.affiliate_discount_codes
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM public.affiliate_users 
            WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Public read for coupon validation
CREATE POLICY "public_read_active_codes" ON public.affiliate_discount_codes
    FOR SELECT USING (is_active = true);

-- Add triggers for updated_at
CREATE TRIGGER update_affiliate_users_updated_at 
    BEFORE UPDATE ON public.affiliate_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_earnings_updated_at 
    BEFORE UPDATE ON public.affiliate_earnings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_discount_codes_updated_at 
    BEFORE UPDATE ON public.affiliate_discount_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create affiliate user account
CREATE OR REPLACE FUNCTION create_affiliate_user(
    email_param TEXT,
    mobile_param TEXT,
    password_param TEXT,
    full_name_param TEXT,
    admin_id UUID
) RETURNS UUID AS $$
DECLARE
    new_affiliate_id UUID;
BEGIN
    INSERT INTO public.affiliate_users (
        email, mobile, password_hash, full_name, created_by
    ) VALUES (
        email_param, mobile_param, crypt(password_param, gen_salt('bf')), 
        full_name_param, admin_id
    ) RETURNING id INTO new_affiliate_id;
    
    RETURN new_affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to authenticate affiliate user
CREATE OR REPLACE FUNCTION authenticate_affiliate_user(
    email_param TEXT,
    password_param TEXT
) RETURNS TABLE (
    id UUID,
    email TEXT,
    mobile TEXT,
    full_name TEXT,
    status TEXT,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT au.id, au.email, au.mobile, au.full_name, au.status,
           (au.password_hash = crypt(password_param, au.password_hash)) as is_valid
    FROM public.affiliate_users au
    WHERE au.email = email_param AND au.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate commission from product settings
CREATE OR REPLACE FUNCTION calc_product_commission(
    product_id_param UUID,
    product_price DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    commission_type TEXT;
    commission_value DECIMAL(10,2);
    calculated_commission DECIMAL(10,2);
BEGIN
    -- Get product commission settings
    SELECT p.affiliate_commission_type, p.affiliate_commission_value 
    INTO commission_type, commission_value
    FROM public.products p 
    WHERE p.id = product_id_param AND p.affiliate_enabled = true;
    
    -- Calculate commission based on type
    IF commission_type = 'percentage' THEN
        calculated_commission := (product_price * commission_value) / 100;
    ELSE
        calculated_commission := commission_value;
    END IF;
    
    RETURN COALESCE(calculated_commission, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Function to create affiliate earning when order is completed
CREATE OR REPLACE FUNCTION create_affiliate_earning()
RETURNS TRIGGER AS $$
DECLARE
    affiliate_record RECORD;
    product_record RECORD;
    commission_amount DECIMAL(10,2);
BEGIN
    -- Only process if order is completed and has affiliate info
    IF NEW.status = 'completed' AND NEW.coupon_code IS NOT NULL THEN
        
        -- Get affiliate from discount code
        SELECT au.*, adc.product_id
        INTO affiliate_record
        FROM public.affiliate_discount_codes adc
        JOIN public.affiliate_users au ON adc.affiliate_id = au.id
        WHERE adc.coupon_code = NEW.coupon_code AND adc.is_active = true;
        
        IF FOUND THEN
            -- Get product details (assuming single product order for now)
            SELECT p.*, calc_product_commission(p.id, p.price) as commission
            INTO product_record
            FROM public.products p
            WHERE p.id = COALESCE(affiliate_record.product_id, p.id) -- Use coupon's product or any product
            AND p.affiliate_enabled = true
            LIMIT 1;
            
            IF FOUND THEN
                -- Create affiliate earning record
                INSERT INTO public.affiliate_earnings (
                    affiliate_id,
                    product_id,
                    order_id,
                    product_price,
                    commission_type,
                    commission_value,
                    commission_amount,
                    status
                ) VALUES (
                    affiliate_record.id,
                    product_record.id,
                    NEW.id,
                    product_record.price,
                    product_record.affiliate_commission_type,
                    product_record.affiliate_commission_value,
                    product_record.commission,
                    'pending'
                );
                
                -- Update discount code usage
                UPDATE public.affiliate_discount_codes 
                SET used_count = used_count + 1
                WHERE coupon_code = NEW.coupon_code;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for affiliate earnings
CREATE TRIGGER create_affiliate_earning_trigger
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION create_affiliate_earning();

-- Function to validate affiliate discount code
CREATE OR REPLACE FUNCTION validate_discount_code(
    coupon_code_param TEXT,
    product_id_param UUID,
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
    -- Get discount code details
    SELECT adc.*, au.status as affiliate_status
    INTO coupon_record
    FROM public.affiliate_discount_codes adc
    JOIN public.affiliate_users au ON adc.affiliate_id = au.id
    WHERE adc.coupon_code = coupon_code_param
    AND (adc.product_id IS NULL OR adc.product_id = product_id_param);
    
    -- Check if code exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, 'Invalid discount code'::TEXT;
        RETURN;
    END IF;
    
    -- Check if code is active
    IF NOT coupon_record.is_active THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, 'Discount code is not active'::TEXT;
        RETURN;
    END IF;
    
    -- Check if affiliate is active
    IF coupon_record.affiliate_status != 'active' THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, 'Affiliate account is not active'::TEXT;
        RETURN;
    END IF;
    
    -- Check expiry date
    IF coupon_record.expiry_date IS NOT NULL AND coupon_record.expiry_date < CURRENT_DATE THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, 'Discount code has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check usage limit
    IF coupon_record.usage_limit IS NOT NULL AND coupon_record.used_count >= coupon_record.usage_limit THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, 'Discount code usage limit exceeded'::TEXT;
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
    ELSE
        calculated_discount := coupon_record.discount_value;
    END IF;
    
    -- Ensure discount doesn't exceed order amount
    IF calculated_discount > order_amount THEN
        calculated_discount := order_amount;
    END IF;
    
    RETURN QUERY SELECT true, calculated_discount, coupon_record.discount_type, 
                        coupon_record.affiliate_id, ''::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Helper functions for admin interface

-- Get all affiliate users
CREATE OR REPLACE FUNCTION get_all_affiliate_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    mobile TEXT,
    full_name TEXT,
    status TEXT,
    total_sales DECIMAL(12,2),
    total_commission DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT au.id, au.email, au.mobile, au.full_name, au.status,
           COALESCE(SUM(ae.product_price), 0.00) as total_sales,
           COALESCE(SUM(ae.commission_amount), 0.00) as total_commission,
           au.created_at
    FROM public.affiliate_users au
    LEFT JOIN public.affiliate_earnings ae ON au.id = ae.affiliate_id
    GROUP BY au.id, au.email, au.mobile, au.full_name, au.status, au.created_at
    ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get affiliate earnings
CREATE OR REPLACE FUNCTION get_affiliate_user_earnings(affiliate_id_param UUID)
RETURNS TABLE (
    id UUID,
    product_name TEXT,
    product_price DECIMAL(10,2),
    commission_amount DECIMAL(10,2),
    status TEXT,
    sale_date DATE,
    order_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT ae.id, p.name, ae.product_price, ae.commission_amount,
           ae.status, ae.sale_date, ae.order_id
    FROM public.affiliate_earnings ae
    LEFT JOIN public.products p ON ae.product_id = p.id
    WHERE ae.affiliate_id = affiliate_id_param
    ORDER BY ae.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get products with affiliate settings
CREATE OR REPLACE FUNCTION get_affiliate_enabled_products()
RETURNS TABLE (
    id UUID,
    name TEXT,
    price DECIMAL(10,2),
    affiliate_enabled BOOLEAN,
    commission_type TEXT,
    commission_value DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.price, p.affiliate_enabled,
           p.affiliate_commission_type, p.affiliate_commission_value
    FROM public.products p
    WHERE p.is_active = true
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON public.affiliate_users TO authenticated;
GRANT ALL ON public.affiliate_earnings TO authenticated;
GRANT ALL ON public.affiliate_discount_codes TO authenticated;
GRANT ALL ON public.affiliate_users TO service_role;
GRANT ALL ON public.affiliate_earnings TO service_role;
GRANT ALL ON public.affiliate_discount_codes TO service_role;

-- Insert some sample data for testing (optional)
-- You can uncomment these lines to add test data

-- INSERT INTO public.affiliate_users (email, mobile, password_hash, full_name, status)
-- VALUES ('test@affiliate.com', '+91 9876543210', crypt('password123', gen_salt('bf')), 'Test Affiliate', 'active');

-- UPDATE public.products 
-- SET affiliate_enabled = true, 
--     affiliate_commission_type = 'percentage', 
--     affiliate_commission_value = 5.00
-- WHERE name ILIKE '%iphone%' OR name ILIKE '%samsung%';