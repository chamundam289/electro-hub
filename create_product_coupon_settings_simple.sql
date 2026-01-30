-- Simple SQL to create product_coupon_settings table
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.product_coupon_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL UNIQUE,
    is_coupon_eligible BOOLEAN DEFAULT true,
    max_coupon_discount DECIMAL(5,2) DEFAULT 0,
    coupon_categories TEXT,
    allow_coupon_stacking BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_product_coupon_settings_product 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_coupon_settings_product ON public.product_coupon_settings(product_id);

-- Disable RLS for development
ALTER TABLE public.product_coupon_settings DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.product_coupon_settings TO authenticated, anon, service_role;