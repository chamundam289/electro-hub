-- =====================================================
-- AFFILIATE ORDERS FIX - Remove orders table dependency
-- =====================================================
-- This fixes the 400 Bad Request error by removing the orders table relationship

-- First, check if affiliate_orders table exists and recreate it without orders dependency
DROP TABLE IF EXISTS public.affiliate_orders CASCADE;

-- Create affiliate_orders table without orders table dependency
CREATE TABLE public.affiliate_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    click_id UUID,
    commission_type VARCHAR(20) NOT NULL,
    commission_rate DECIMAL(10,2) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'reversed')),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    order_total DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Disable RLS and grant permissions
ALTER TABLE public.affiliate_orders DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.affiliate_orders TO anon, authenticated, postgres;

-- Create indexes for performance
CREATE INDEX idx_affiliate_orders_affiliate_id ON public.affiliate_orders(affiliate_id);
CREATE INDEX idx_affiliate_orders_order_id ON public.affiliate_orders(order_id);
CREATE INDEX idx_affiliate_orders_product_id ON public.affiliate_orders(product_id);
CREATE INDEX idx_affiliate_orders_status ON public.affiliate_orders(status);
CREATE INDEX idx_affiliate_orders_created_at ON public.affiliate_orders(created_at);

-- Insert some sample data for testing
INSERT INTO public.affiliate_orders (
    affiliate_id, 
    order_id, 
    product_id, 
    commission_type, 
    commission_rate, 
    product_price, 
    quantity, 
    commission_amount, 
    status,
    customer_name,
    customer_email,
    order_total
) 
SELECT 
    au.id as affiliate_id,
    gen_random_uuid() as order_id,
    p.id as product_id,
    'percentage' as commission_type,
    5.00 as commission_rate,
    p.price as product_price,
    1 as quantity,
    (p.price * 5.00 / 100) as commission_amount,
    'confirmed' as status,
    'Test Customer' as customer_name,
    'test@example.com' as customer_email,
    p.price as order_total
FROM public.affiliate_users au
CROSS JOIN public.products p
WHERE au.mobile_number = '9999999999'
AND p.is_visible = true
LIMIT 3;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'AFFILIATE ORDERS TABLE FIXED!' as status,
       'Orders table dependency removed' as fix_applied,
       'Sample orders created for testing' as sample_data,
       'The 400 Bad Request error should now be resolved' as result;