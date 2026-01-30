-- Fix loyalty_product_settings table if it's causing errors
-- Run this in Supabase SQL Editor if the debug script shows loyalty table errors

-- Check if loyalty_product_settings table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loyalty_product_settings') THEN
        -- Create the table if it doesn't exist
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
        
        -- Disable RLS
        ALTER TABLE public.loyalty_product_settings DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL ON public.loyalty_product_settings TO anon, authenticated, postgres;
        
        RAISE NOTICE 'loyalty_product_settings table created successfully';
    ELSE
        RAISE NOTICE 'loyalty_product_settings table already exists';
    END IF;
END
$$;

-- Ensure proper permissions are set
GRANT ALL ON public.loyalty_product_settings TO anon, authenticated, postgres;
ALTER TABLE public.loyalty_product_settings DISABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_loyalty_product_settings_product_id ON public.loyalty_product_settings(product_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Loyalty product settings table is now ready!' as status;