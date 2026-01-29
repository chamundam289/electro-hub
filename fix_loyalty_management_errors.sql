-- ============================================
-- 🔧 FIX LOYALTY MANAGEMENT ERRORS
-- ============================================
-- This script fixes 400 and 406 errors in Loyalty Management

-- Step 1: Create loyalty tables if they don't exist
CREATE TABLE IF NOT EXISTS public.loyalty_coins_wallet (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_coins_earned INTEGER NOT NULL DEFAULT 0,
    total_coins_used INTEGER NOT NULL DEFAULT 0,
    available_coins INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'manual_add', 'manual_remove')),
    coins_amount INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT,
    description TEXT,
    admin_notes TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

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

-- Step 2: Enable RLS on all tables
ALTER TABLE public.loyalty_coins_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_product_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_system_settings ENABLE ROW LEVEL SECURITY;

-- Step 3: Create permissive RLS policies
-- Loyalty Coins Wallet Policies
DROP POLICY IF EXISTS "Allow all access to loyalty_coins_wallet" ON public.loyalty_coins_wallet;
CREATE POLICY "Allow all access to loyalty_coins_wallet" ON public.loyalty_coins_wallet
    FOR ALL USING (true) WITH CHECK (true);

-- Loyalty Transactions Policies
DROP POLICY IF EXISTS "Allow all access to loyalty_transactions" ON public.loyalty_transactions;
CREATE POLICY "Allow all access to loyalty_transactions" ON public.loyalty_transactions
    FOR ALL USING (true) WITH CHECK (true);

-- Loyalty Product Settings Policies
DROP POLICY IF EXISTS "Allow all access to loyalty_product_settings" ON public.loyalty_product_settings;
CREATE POLICY "Allow all access to loyalty_product_settings" ON public.loyalty_product_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Loyalty System Settings Policies
DROP POLICY IF EXISTS "Allow all access to loyalty_system_settings" ON public.loyalty_system_settings;
CREATE POLICY "Allow all access to loyalty_system_settings" ON public.loyalty_system_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Grant permissions
GRANT ALL ON public.loyalty_coins_wallet TO anon, authenticated, service_role;
GRANT ALL ON public.loyalty_transactions TO anon, authenticated, service_role;
GRANT ALL ON public.loyalty_product_settings TO anon, authenticated, service_role;
GRANT ALL ON public.loyalty_system_settings TO anon, authenticated, service_role;

-- Step 5: Insert default system settings
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

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_coins_wallet_user_id ON public.loyalty_coins_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON public.loyalty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_product_settings_product_id ON public.loyalty_product_settings(product_id);

-- Step 7: Create sample data for testing (optional)
-- Uncomment if you want test data
/*
-- Create a test wallet
INSERT INTO public.loyalty_coins_wallet (user_id, total_coins_earned, available_coins)
SELECT 
    id as user_id,
    100 as total_coins_earned,
    100 as available_coins
FROM auth.users 
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- Create a test transaction
INSERT INTO public.loyalty_transactions (user_id, transaction_type, coins_amount, description)
SELECT 
    id as user_id,
    'earned' as transaction_type,
    100 as coins_amount,
    'Test transaction for loyalty management' as description
FROM auth.users 
LIMIT 1;
*/

-- Step 8: Verify setup
SELECT 'Loyalty Management Setup Complete!' as status;

-- Show table counts
SELECT 
    'loyalty_coins_wallet' as table_name,
    COUNT(*) as record_count
FROM public.loyalty_coins_wallet
UNION ALL
SELECT 'loyalty_transactions', COUNT(*) FROM public.loyalty_transactions
UNION ALL
SELECT 'loyalty_product_settings', COUNT(*) FROM public.loyalty_product_settings
UNION ALL
SELECT 'loyalty_system_settings', COUNT(*) FROM public.loyalty_system_settings;

-- Show system settings
SELECT 
    'System Settings' as info,
    is_system_enabled,
    default_coins_per_rupee,
    min_coins_to_redeem
FROM public.loyalty_system_settings
LIMIT 1;