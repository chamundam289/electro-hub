-- Enhanced Product-Based Affiliate System
-- Run this in Supabase SQL Editor

-- Create affiliate_product_assignments table
CREATE TABLE IF NOT EXISTS public.affiliate_product_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('fixed', 'percentage')),
    commission_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_by UUID REFERENCES public.profiles(id), -- Admin who assigned
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(affiliate_id, product_id)
);

-- Create affiliate_product_coupons table (product-specific coupons)
CREATE TABLE IF NOT EXISTS public.affiliate_product_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.affiliate_product_assignments(id) ON DELETE CASCADE,
    coupon_code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER DEFAULT NULL,
    used_count INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update orders table to include product-specific affiliate tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS assigned_product_id UUID REFERENCES public.products(id),
ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.affiliate_product_assignments(id);

-- Update affiliate_commissions table for product-based commissions
ALTER TABLE public.affiliate_commissions 
ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.affiliate_product_assignments(id),
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id),
ADD COLUMN IF NOT EXISTS product_price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Enable RLS on new tables
ALTER TABLE public.affiliate_product_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_product_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliate_product_assignments
CREATE POLICY "Affiliates can view own assignments" ON public.affiliate_product_assignments
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM public.affiliates WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all assignments" ON public.affiliate_product_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for affiliate_product_coupons
CREATE POLICY "Affiliates can view own product coupons" ON public.affiliate_product_coupons
    FOR SELECT USING (
        assignment_id IN (
            SELECT id FROM public.affiliate_product_assignments 
            WHERE affiliate_id IN (
                SELECT id FROM public.affiliates WHERE user_id = auth.uid()
            )
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all product coupons" ON public.affiliate_product_coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Public read access for coupon validation
CREATE POLICY "Public can read active product coupons for validation" ON public.affiliate_product_coupons
    FOR SELECT USING (is_active = true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_affiliate_product_assignments_updated_at 
    BEFORE UPDATE ON public.affiliate_product_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_product_coupons_updated_at 
    BEFORE UPDATE ON public.affiliate_product_coupons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate product-based commission
CREATE OR REPLACE FUNCTION calculate_product_commission(
    assignment_id_param UUID,
    product_price DECIMAL(10,2),
    quantity INTEGER DEFAULT 1
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    commission_type TEXT;
    commission_value DECIMAL(10,2);
    calculated_commission DECIMAL(10,2);
    total_product_value DECIMAL(10,2);
BEGIN
    -- Get assignment commission settings
    SELECT apa.commission_type, apa.commission_value 
    INTO commission_type, commission_value
    FROM public.affiliate_product_assignments apa 
    WHERE apa.id = assignment_id_param;
    
    -- Calculate total product value
    total_product_value := product_price * quantity;
    
    -- Calculate commission based on type
    IF commission_type = 'percentage' THEN
        calculated_commission := (total_product_value * commission_value) / 100;
    ELSE
        calculated_commission := commission_value * quantity;
    END IF;
    
    RETURN COALESCE(calculated_commission, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Function to create product-based commission when order is placed
CREATE OR REPLACE FUNCTION create_product_based_commission()
RETURNS TRIGGER AS $$
DECLARE
    assignment_record RECORD;
    commission_amount DECIMAL(10,2);
    product_record RECORD;
BEGIN
    -- Only create commission if order has assignment_id and is completed
    IF NEW.assignment_id IS NOT NULL AND NEW.status = 'completed' THEN
        
        -- Get assignment details
        SELECT apa.*, a.id as affiliate_id, p.price as product_price
        INTO assignment_record
        FROM public.affiliate_product_assignments apa
        JOIN public.affiliates a ON apa.affiliate_id = a.id
        LEFT JOIN public.products p ON apa.product_id = p.id
        WHERE apa.id = NEW.assignment_id;
        
        IF FOUND THEN
            -- Calculate commission based on product price
            commission_amount := calculate_product_commission(
                NEW.assignment_id, 
                assignment_record.product_price, 
                1 -- quantity, can be updated based on order items
            );
            
            -- Insert commission record
            INSERT INTO public.affiliate_commissions (
                affiliate_id, 
                order_id, 
                assignment_id,
                product_id,
                product_price,
                quantity,
                commission_amount, 
                commission_rate, 
                order_amount,
                status
            ) VALUES (
                assignment_record.affiliate_id, 
                NEW.id, 
                NEW.assignment_id,
                assignment_record.product_id,
                assignment_record.product_price,
                1,
                commission_amount, 
                assignment_record.commission_value, 
                NEW.total_amount,
                'pending'
            ) ON CONFLICT (order_id) DO UPDATE SET
                commission_amount = EXCLUDED.commission_amount,
                commission_rate = EXCLUDED.commission_rate,
                assignment_id = EXCLUDED.assignment_id,
                product_id = EXCLUDED.product_id,
                product_price = EXCLUDED.product_price,
                updated_at = now();
            
            -- Update affiliate totals
            UPDATE public.affiliates 
            SET 
                total_sales = total_sales + assignment_record.product_price,
                total_commission = total_commission + commission_amount,
                total_orders = total_orders + 1,
                updated_at = now()
            WHERE id = assignment_record.affiliate_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the old trigger with new product-based one
DROP TRIGGER IF EXISTS create_commission_on_order_completion ON public.orders;
CREATE TRIGGER create_product_commission_on_order_completion
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION create_product_based_commission();

-- Function to validate product-specific coupon
CREATE OR REPLACE FUNCTION validate_product_coupon(
    coupon_code_param TEXT,
    product_id_param UUID,
    order_amount DECIMAL(10,2)
) RETURNS TABLE (
    is_valid BOOLEAN,
    discount_amount DECIMAL(10,2),
    discount_type TEXT,
    assignment_id UUID,
    affiliate_id UUID,
    error_message TEXT
) AS $$
DECLARE
    coupon_record RECORD;
    calculated_discount DECIMAL(10,2) := 0.00;
BEGIN
    -- Get product coupon details
    SELECT apc.*, apa.affiliate_id, apa.product_id, a.status as aff_status
    INTO coupon_record
    FROM public.affiliate_product_coupons apc
    JOIN public.affiliate_product_assignments apa ON apc.assignment_id = apa.id
    JOIN public.affiliates a ON apa.affiliate_id = a.id
    WHERE apc.coupon_code = coupon_code_param 
    AND apa.product_id = product_id_param;
    
    -- Check if coupon exists for this product
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, NULL::UUID, 'Invalid coupon code for this product'::TEXT;
        RETURN;
    END IF;
    
    -- Check if coupon is active
    IF NOT coupon_record.is_active THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, NULL::UUID, 'Coupon is not active'::TEXT;
        RETURN;
    END IF;
    
    -- Check if affiliate is active
    IF coupon_record.aff_status != 'active' THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, NULL::UUID, 'Affiliate account is not active'::TEXT;
        RETURN;
    END IF;
    
    -- Check expiry date
    IF coupon_record.expiry_date IS NOT NULL AND coupon_record.expiry_date < CURRENT_DATE THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, NULL::UUID, 'Coupon has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check usage limit
    IF coupon_record.usage_limit IS NOT NULL AND coupon_record.used_count >= coupon_record.usage_limit THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, NULL::UUID, 'Coupon usage limit exceeded'::TEXT;
        RETURN;
    END IF;
    
    -- Check minimum order amount
    IF coupon_record.min_order_amount > 0 AND order_amount < coupon_record.min_order_amount THEN
        RETURN QUERY SELECT false, 0.00::DECIMAL(10,2), ''::TEXT, NULL::UUID, NULL::UUID, 
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
    
    RETURN QUERY SELECT true, calculated_discount, coupon_record.discount_type, 
                        coupon_record.assignment_id, coupon_record.affiliate_id, ''::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Helper functions for admin interface

-- Function to get affiliate product assignments
CREATE OR REPLACE FUNCTION get_affiliate_assignments(affiliate_id_param UUID)
RETURNS TABLE (
    id UUID,
    affiliate_id UUID,
    product_id UUID,
    product_name TEXT,
    product_price DECIMAL(10,2),
    commission_type TEXT,
    commission_value DECIMAL(10,2),
    is_active BOOLEAN,
    assigned_date DATE,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT apa.id, apa.affiliate_id, apa.product_id, p.name, p.price,
           apa.commission_type, apa.commission_value, apa.is_active,
           apa.assigned_date, apa.notes
    FROM public.affiliate_product_assignments apa
    LEFT JOIN public.products p ON apa.product_id = p.id
    WHERE apa.affiliate_id = affiliate_id_param
    ORDER BY apa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available products for assignment
CREATE OR REPLACE FUNCTION get_available_products_for_affiliate(affiliate_id_param UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    price DECIMAL(10,2),
    is_assigned BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.price,
           CASE WHEN apa.id IS NOT NULL THEN true ELSE false END as is_assigned
    FROM public.products p
    LEFT JOIN public.affiliate_product_assignments apa 
        ON p.id = apa.product_id AND apa.affiliate_id = affiliate_id_param
    WHERE p.is_active = true
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product-specific coupons
CREATE OR REPLACE FUNCTION get_product_coupons(assignment_id_param UUID)
RETURNS TABLE (
    id UUID,
    assignment_id UUID,
    coupon_code TEXT,
    discount_type TEXT,
    discount_value DECIMAL(10,2),
    min_order_amount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER,
    expiry_date DATE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT apc.id, apc.assignment_id, apc.coupon_code, apc.discount_type,
           apc.discount_value, apc.min_order_amount, apc.usage_limit,
           apc.used_count, apc.expiry_date, apc.is_active
    FROM public.affiliate_product_coupons apc
    WHERE apc.assignment_id = assignment_id_param
    ORDER BY apc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;