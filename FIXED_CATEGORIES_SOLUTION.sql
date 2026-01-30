-- =====================================================
-- FIXED CATEGORIES SOLUTION - Handles existing slug column
-- =====================================================
-- This fixes the null value in column "slug" error

-- First, let's check the existing categories table structure and fix it
DO $$
DECLARE
    has_slug_column BOOLEAN;
BEGIN
    -- Check if slug column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'slug'
    ) INTO has_slug_column;
    
    IF has_slug_column THEN
        -- If slug column exists, make it nullable temporarily
        ALTER TABLE public.categories ALTER COLUMN slug DROP NOT NULL;
        RAISE NOTICE 'Made slug column nullable';
    END IF;
END
$$;

-- Now safely insert categories with proper slugs
INSERT INTO public.categories (name, slug, description, is_active) 
VALUES 
    ('Electronics', 'electronics', 'Electronic devices and accessories', true),
    ('Mobile Accessories', 'mobile-accessories', 'Mobile phone accessories and parts', true),
    ('General', 'general', 'General products', true)
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- Update any existing categories that might have null slugs
UPDATE public.categories 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'))
WHERE slug IS NULL;

-- Now make slug NOT NULL again if it was originally NOT NULL
DO $$
DECLARE
    has_slug_column BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'slug'
    ) INTO has_slug_column;
    
    IF has_slug_column THEN
        -- Make slug NOT NULL again
        ALTER TABLE public.categories ALTER COLUMN slug SET NOT NULL;
        RAISE NOTICE 'Made slug column NOT NULL again';
    END IF;
END
$$;

-- Ensure categories table has proper permissions
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.categories TO anon, authenticated, postgres;

-- =====================================================
-- NOW RUN THE REST OF THE FIXES (without categories part)
-- =====================================================

-- Fix loyalty_product_settings table
DROP TABLE IF EXISTS public.loyalty_product_settings CASCADE;

CREATE TABLE public.loyalty_product_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    coins_earned_per_purchase INTEGER DEFAULT 0,
    coins_required_to_buy INTEGER DEFAULT 0,
    is_coin_purchase_enabled BOOLEAN DEFAULT false,
    is_coin_earning_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id)
);

ALTER TABLE public.loyalty_product_settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.loyalty_product_settings TO anon, authenticated, postgres;
CREATE INDEX idx_loyalty_product_settings_product_id ON public.loyalty_product_settings(product_id);

-- Fix product_images table
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_alt TEXT,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.product_images TO anon, authenticated, postgres;
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- Fix affiliate tables
DROP TABLE IF EXISTS public.affiliate_sessions CASCADE;
DROP TABLE IF EXISTS public.affiliate_payouts CASCADE;
DROP TABLE IF EXISTS public.affiliate_commissions CASCADE;
DROP TABLE IF EXISTS public.affiliate_orders CASCADE;
DROP TABLE IF EXISTS public.affiliate_clicks CASCADE;
DROP TABLE IF EXISTS public.product_affiliate_settings CASCADE;
DROP TABLE IF EXISTS public.affiliate_users CASCADE;
DROP FUNCTION IF EXISTS public.generate_affiliate_code() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_affiliate_commission(TEXT, DECIMAL, DECIMAL, INTEGER) CASCADE;

-- Create affiliate_users table
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

-- Create product_affiliate_settings table
CREATE TABLE public.product_affiliate_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    is_affiliate_enabled BOOLEAN DEFAULT false,
    commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('fixed', 'percentage')),
    commission_value DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id)
);

-- Create affiliate_clicks table
CREATE TABLE public.affiliate_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    converted_to_order BOOLEAN DEFAULT false,
    order_id UUID
);

-- Create affiliate_orders table
CREATE TABLE public.affiliate_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
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

-- Create affiliate_commissions table
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

-- Create affiliate_payouts table
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

-- Disable RLS on all affiliate tables
ALTER TABLE public.affiliate_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_affiliate_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.affiliate_users TO anon, authenticated, postgres;
GRANT ALL ON public.product_affiliate_settings TO anon, authenticated, postgres;
GRANT ALL ON public.affiliate_clicks TO anon, authenticated, postgres;
GRANT ALL ON public.affiliate_orders TO anon, authenticated, postgres;
GRANT ALL ON public.affiliate_commissions TO anon, authenticated, postgres;
GRANT ALL ON public.affiliate_payouts TO anon, authenticated, postgres;

-- Create affiliate functions
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

GRANT EXECUTE ON FUNCTION public.generate_affiliate_code() TO anon, authenticated, postgres;
GRANT EXECUTE ON FUNCTION public.calculate_affiliate_commission(TEXT, DECIMAL, DECIMAL, INTEGER) TO anon, authenticated, postgres;

-- Add missing columns to products table if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'coins_earned_per_purchase') THEN
        ALTER TABLE public.products ADD COLUMN coins_earned_per_purchase INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'coins_required_to_buy') THEN
        ALTER TABLE public.products ADD COLUMN coins_required_to_buy INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_coin_purchase_enabled') THEN
        ALTER TABLE public.products ADD COLUMN is_coin_purchase_enabled BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Ensure products table permissions
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.products TO anon, authenticated, postgres;

-- Insert sample affiliate user
INSERT INTO public.affiliate_users (name, mobile_number, password_hash, affiliate_code, is_active) 
VALUES ('Test Affiliate', '9999999999', encode(digest('password123', 'sha256'), 'hex'), 'AFF000001', true)
ON CONFLICT (mobile_number) DO NOTHING;

-- Grant all permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'FIXED CATEGORIES SOLUTION APPLIED SUCCESSFULLY!' as status,
       'Categories table fixed with proper slug values' as categories_status,
       'All other tables created successfully' as tables_status,
       'Product management should now work perfectly' as final_status;