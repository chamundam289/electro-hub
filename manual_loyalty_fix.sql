-- ============================================
-- 🔧 MANUAL LOYALTY FIX - STEP BY STEP
-- ============================================

-- Step 1: Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'loyalty_product_settings';

-- Step 2: If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.loyalty_product_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    coins_earned_per_purchase INTEGER DEFAULT 0,
    coins_required_to_buy INTEGER DEFAULT 0,
    is_coin_purchase_enabled BOOLEAN DEFAULT false,
    is_coin_earning_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(product_id)
);

-- Step 3: Disable RLS temporarily for setup
ALTER TABLE public.loyalty_product_settings DISABLE ROW LEVEL SECURITY;

-- Step 4: Insert sample loyalty settings for one product
INSERT INTO public.loyalty_product_settings (
    product_id,
    coins_earned_per_purchase,
    coins_required_to_buy,
    is_coin_purchase_enabled,
    is_coin_earning_enabled
)
SELECT 
    id as product_id,
    15 as coins_earned_per_purchase,
    150 as coins_required_to_buy,
    true as is_coin_purchase_enabled,
    true as is_coin_earning_enabled
FROM public.products 
LIMIT 1
ON CONFLICT (product_id) DO UPDATE SET
    coins_earned_per_purchase = EXCLUDED.coins_earned_per_purchase,
    coins_required_to_buy = EXCLUDED.coins_required_to_buy,
    is_coin_purchase_enabled = EXCLUDED.is_coin_purchase_enabled,
    updated_at = now();

-- Step 5: Re-enable RLS with simple policy
ALTER TABLE public.loyalty_product_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON public.loyalty_product_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Step 6: Grant permissions
GRANT ALL ON public.loyalty_product_settings TO anon, authenticated, service_role;

-- Step 7: Verify setup
SELECT 
    p.name,
    lps.coins_earned_per_purchase,
    lps.coins_required_to_buy,
    lps.is_coin_purchase_enabled
FROM public.products p
JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
LIMIT 5;