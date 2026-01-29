-- ============================================
-- 🔧 FIX ALL LOYALTY SYSTEM ERRORS
-- ============================================

-- Step 1: Create loyalty tables if they don't exist
CREATE TABLE IF NOT EXISTS public.loyalty_product_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    coins_earned_per_purchase INTEGER NOT NULL DEFAULT 0,
    coins_required_to_buy INTEGER NOT NULL DEFAULT 0,
    is_coin_purchase_enabled BOOLEAN NOT NULL DEFAULT false,
    is_coin_earning_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(product_id)
);

CREATE TABLE IF NOT EXISTS public.loyalty_system_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    is_system_enabled BOOLEAN NOT NULL DEFAULT true,
    global_coins_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    default_coins_per_rupee DECIMAL(5,2) NOT NULL DEFAULT 0.10,
    coin_expiry_days INTEGER DEFAULT NULL,
    min_coins_to_redeem INTEGER NOT NULL DEFAULT 10,
    max_coins_per_order INTEGER DEFAULT NULL,
    festive_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    festive_start_date TIMESTAMP WITH TIME ZONE,
    festive_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 2: Enable RLS on loyalty tables
ALTER TABLE public.loyalty_product_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_system_settings ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view product loyalty settings" ON public.loyalty_product_settings;
DROP POLICY IF EXISTS "Admins can manage product loyalty settings" ON public.loyalty_product_settings;
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.loyalty_system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.loyalty_system_settings;

-- Step 4: Create permissive policies for loyalty_product_settings
CREATE POLICY "Anyone can view product loyalty settings" ON public.loyalty_product_settings
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert product loyalty settings" ON public.loyalty_product_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update product loyalty settings" ON public.loyalty_product_settings
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete product loyalty settings" ON public.loyalty_product_settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Step 5: Create permissive policies for loyalty_system_settings
CREATE POLICY "Anyone can view system settings" ON public.loyalty_system_settings
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert system settings" ON public.loyalty_system_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update system settings" ON public.loyalty_system_settings
    FOR UPDATE USING (true);

-- Step 6: Insert default system settings if not exists
INSERT INTO public.loyalty_system_settings (
    is_system_enabled,
    global_coins_multiplier,
    default_coins_per_rupee,
    coin_expiry_days,
    min_coins_to_redeem,
    max_coins_per_order,
    festive_multiplier
) VALUES (
    true,
    1.00,
    0.10,
    NULL,
    10,
    NULL,
    1.00
) ON CONFLICT DO NOTHING;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_product_settings_product_id ON public.loyalty_product_settings(product_id);

-- Step 8: Grant necessary permissions
GRANT ALL ON public.loyalty_product_settings TO anon, authenticated;
GRANT ALL ON public.loyalty_system_settings TO anon, authenticated;

-- Step 9: Verify tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'loyalty_%'
ORDER BY table_name;

-- Step 10: Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename LIKE 'loyalty_%'
ORDER BY tablename, policyname;