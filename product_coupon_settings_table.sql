-- ============================================
-- PRODUCT COUPON SETTINGS TABLE
-- ============================================
-- This table stores coupon eligibility and configuration settings for individual products

CREATE TABLE IF NOT EXISTS public.product_coupon_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL UNIQUE,
    
    -- Coupon Eligibility
    is_coupon_eligible BOOLEAN DEFAULT true,
    max_coupon_discount DECIMAL(5,2) DEFAULT 0, -- Maximum discount percentage allowed (0 = no limit)
    coupon_categories TEXT, -- Comma-separated categories for targeted campaigns
    allow_coupon_stacking BOOLEAN DEFAULT true, -- Allow stacking with loyalty coins
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Foreign key constraint
    CONSTRAINT fk_product_coupon_settings_product 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_coupon_settings_product ON public.product_coupon_settings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_coupon_settings_eligible ON public.product_coupon_settings(is_coupon_eligible);

-- Enable RLS
ALTER TABLE public.product_coupon_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view product coupon settings" ON public.product_coupon_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage product coupon settings" ON public.product_coupon_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Grant permissions
GRANT SELECT ON public.product_coupon_settings TO authenticated, anon;
GRANT ALL ON public.product_coupon_settings TO service_role;

-- Add some sample data for existing products
INSERT INTO public.product_coupon_settings (product_id, is_coupon_eligible, max_coupon_discount, coupon_categories, allow_coupon_stacking)
SELECT 
    id as product_id,
    true as is_coupon_eligible,
    50 as max_coupon_discount, -- 50% max discount
    'general,electronics' as coupon_categories,
    true as allow_coupon_stacking
FROM public.products 
WHERE NOT EXISTS (
    SELECT 1 FROM public.product_coupon_settings 
    WHERE product_coupon_settings.product_id = products.id
)
LIMIT 10; -- Only add for first 10 products to avoid overwhelming

COMMENT ON TABLE public.product_coupon_settings IS 'Product-level coupon eligibility and configuration settings';
COMMENT ON COLUMN public.product_coupon_settings.max_coupon_discount IS 'Maximum discount percentage allowed for this product (0 = no limit)';
COMMENT ON COLUMN public.product_coupon_settings.coupon_categories IS 'Comma-separated categories for targeted coupon campaigns';
COMMENT ON COLUMN public.product_coupon_settings.allow_coupon_stacking IS 'Whether coupons can be stacked with loyalty coins for this product';