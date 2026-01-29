-- Simple fix for loyalty system 403 errors
-- This removes all existing policies and creates minimal working ones

-- Clean slate - remove all existing policies
DO $$ 
DECLARE
    pol_name text;
BEGIN
    -- Drop all policies on loyalty_coins_wallet
    FOR pol_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'loyalty_coins_wallet' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.loyalty_coins_wallet';
    END LOOP;
    
    -- Drop all policies on loyalty_transactions
    FOR pol_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'loyalty_transactions' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.loyalty_transactions';
    END LOOP;
END $$;

-- Create simple, working policies
CREATE POLICY "wallet_user_access" ON public.loyalty_coins_wallet
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "transactions_user_access" ON public.loyalty_transactions
    FOR ALL USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.loyalty_coins_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.loyalty_coins_wallet TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.loyalty_transactions TO authenticated;

-- Success message
SELECT 'Loyalty system RLS policies fixed successfully!' as result;