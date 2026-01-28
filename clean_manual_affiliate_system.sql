-- Clean Manual Affiliate Account Creation System
-- This version drops existing policies first to avoid conflicts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all coupons" ON public.affiliate_coupons;
DROP POLICY IF EXISTS "Affiliates can view own coupons" ON public.affiliate_coupons;
DROP POLICY IF EXISTS "Public can read active coupons" ON public.affiliate_coupons;
DROP POLICY IF EXISTS "Public can read active product coupons for validation" ON public.affiliate_product_coupons;
DROP POLICY IF EXISTS "Admins can manage all product coupons" ON public.affiliate_product_coupons;

-- Drop existing tables if they exist (be careful with this in production)
DROP TABLE IF EXISTS public.affiliate_product_coupons CASCADE;
DROP TABLE IF EXISTS public.affiliate_product_assignments CASCADE;

-- Update products table to include commission settings
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS affiliate_commission_type TEXT DEFAULT 'percentage' CHECK (affiliate_commission_type IN ('fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS affiliate_commission_value DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN DEFAULT false;

-- Create affiliate_accounts table for manual account management
CREATE TABLE IF NOT EXISTS public.affiliate_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_by UUID REFERENCES public.profiles(id), -- Admin who created
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_sales table to track sales
CREATE TABLE IF NOT EXISTS public.affiliate_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_accounts(id) ON DELETE CASCADE,
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

-- Drop existing affiliate_coupons table and recreate
DROP TABLE IF EXISTS public.affiliate_coupons CASCADE;

-- Create new affiliate_coupons table (simplified)
CREATE TABLE public.affiliate_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_accounts(id) ON DELETE CASCADE,
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

-- Enable RLS
ALTER TABLE public.affiliate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliate_accounts
CREATE POLICY "Admins can manage affiliate accounts" ON public.affiliate_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Affiliates can view own account" ON public.affiliate_accounts
    FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for affiliate_sales
CREATE POLICY "Admins can manage all sales" ON public.affiliate_sales
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Affiliates can view own sales" ON public.affiliate_sales
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM public.affiliate_accounts 
            WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- RLS Policies for affiliate_coupons (new clean policies)
CREATE POLICY "Admins manage affiliate coupons" ON public.affiliate_coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Affiliates view own coupons" ON public.affiliate_coupons
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM public.affiliate_accounts 
            WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Public read for coupon validation
CREATE POLICY "Public read active coupons" ON public.affiliate_coupons
    FOR SELECT USING (is_active = true);

-- Add triggers for updated_at
CREATE TRIGGER update_affiliate_accounts_updated_at 
    BEFORE UPDATE ON public.affiliate_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_sales_updated_at 
    BEFORE UPDATE ON public.affiliate_sales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_coupons_updated_at 
    BEFORE UPDATE ON public.affiliate_coupons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create affiliate account
CREATE OR REPLACE FUNCTION create_affiliate_account(
    email_param TEXT,
    mobile_param TEXT,
    password_param TEXT,
    full_name_param TEXT,
    admin_id UUID
) RETURNS UUID AS $$
DECLARE
    new_affiliate_id UUID;
BEGIN
    INSERT INTO public.affiliate_accounts (
        email, mobile, password_hash, full_name, created_by
    ) VALUES (
        email_param, mobile_param, crypt(password_param, gen_salt('bf')), 
        full_name_param, admin_id
    ) RETURNING id INTO new_affiliate_id;
    
    RETURN new_affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to authenticate affiliate
CREATE OR REPLACE FUNCTION authenticate_affiliate(
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
    SELECT aa.id, aa.email, aa.mobile, aa.full_name, aa.status,
           (aa.password_hash = crypt(password_param, aa.password_hash)) as is_valid
    FROM public.affiliate_accounts aa
    WHERE aa.email = email_param AND aa.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate commission from product settings
CREATE OR REPLACE FUNCTION calculate_product_commission(
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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS create_commission_on_order_completion ON public.orders;
DROP TRIGGER IF EXISTS create_product_commission_on_order_completion ON public.orders;
DROP TRIGGER IF EXISTS create_affiliate_sale_trigger ON public.orders;

-- Function to create affiliate sale when order is completed
CREATE OR REPLACE FUNCTION create_affiliate_sale()
RETURNS TRIGGER AS $$
DECLARE
    affiliate_record RECORD;
    product_record RECORD;
    commission_amount DECIMAL(10,2);
BEGIN
    -- Only process if order is completed and has affiliate info
    IF NEW.status = 'completed' AND NEW.coupon_code IS NOT NULL THEN
        
        -- Get affiliate from coupon
        SELECT aa.*, ac.product_id
        INTO affiliate_record
        FROM public.affiliate_coupons ac
        JOIN public.affiliate_accounts aa ON ac.affiliate_id = aa.id
        WHERE ac.coupon_code = NEW.coupon_code AND ac.is_active = true;
        
        IF FOUND THEN
            -- Get product details (assuming single product order for now)
            SELECT p.*, calculate_product_commission(p.id, p.price) as commission
            INTO product_record
            FROM public.products p
            WHERE p.id = COALESCE(affiliate_record.product_id, p.id) -- Use coupon's product or any product
            AND p.affiliate_enabled = true
            LIMIT 1;
            
            IF FOUND THEN
                -- Create affiliate sale record
                INSERT INTO public.affiliate_sales (
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
                
                -- Update coupon usage
                UPDATE public.affiliate_coupons 
                SET used_count = used_count + 1
                WHERE coupon_code = NEW.coupon_code;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for affiliate sales
CREATE TRIGGER create_affiliate_sale_trigger
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION create_affiliate_sale();

-- Function to validate affiliate coupon
CREATE OR REPLACE FUNCTION validate_affiliate_coupon(
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
    -- Get coupon details
    SELECT ac.*, aa.status as affiliate_status
    INTO coupon_record
    FROM public.affiliate_coupons ac
    JOIN public.affiliate_accounts aa ON ac.affiliate_id = aa.id
    WHERE ac.coupon_code = coupon_code_param
    AND (ac.product_id IS NULL OR ac.product_id = product_id_param);
    
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
    IF coupon_record.affiliate_status != 'active' THEN
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

-- Get all affiliate accounts
CREATE OR REPLACE FUNCTION get_all_affiliates()
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
    SELECT aa.id, aa.email, aa.mobile, aa.full_name, aa.status,
           COALESCE(SUM(afs.product_price), 0.00) as total_sales,
           COALESCE(SUM(afs.commission_amount), 0.00) as total_commission,
           aa.created_at
    FROM public.affiliate_accounts aa
    LEFT JOIN public.affiliate_sales afs ON aa.id = afs.affiliate_id
    GROUP BY aa.id, aa.email, aa.mobile, aa.full_name, aa.status, aa.created_at
    ORDER BY aa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get affiliate sales
CREATE OR REPLACE FUNCTION get_affiliate_sales(affiliate_id_param UUID)
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
    SELECT afs.id, p.name, afs.product_price, afs.commission_amount,
           afs.status, afs.sale_date, afs.order_id
    FROM public.affiliate_sales afs
    LEFT JOIN public.products p ON afs.product_id = p.id
    WHERE afs.affiliate_id = affiliate_id_param
    ORDER BY afs.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get products with affiliate settings
CREATE OR REPLACE FUNCTION get_affiliate_products()
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
GRANT ALL ON public.affiliate_accounts TO authenticated;
GRANT ALL ON public.affiliate_sales TO authenticated;
GRANT ALL ON public.affiliate_coupons TO authenticated;
GRANT ALL ON public.affiliate_accounts TO service_role;
GRANT ALL ON public.affiliate_sales TO service_role;
GRANT ALL ON public.affiliate_coupons TO service_role;