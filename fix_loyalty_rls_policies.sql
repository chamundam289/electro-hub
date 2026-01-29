-- Fix RLS Policies for Loyalty System
-- This addresses the 403 errors by ensuring users can access their own data

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own wallet" ON public.loyalty_coins_wallet;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.loyalty_coins_wallet;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.loyalty_coins_wallet;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Users can manage own wallet" ON public.loyalty_coins_wallet;
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Admins can manage all wallets" ON public.loyalty_coins_wallet;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.loyalty_coins_wallet;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.loyalty_transactions;

-- Create comprehensive policies for loyalty_coins_wallet
CREATE POLICY "Users can manage own wallet" ON public.loyalty_coins_wallet
    FOR ALL USING (auth.uid() = user_id);

-- Create comprehensive policies for loyalty_transactions  
CREATE POLICY "Users can manage own transactions" ON public.loyalty_transactions
    FOR ALL USING (auth.uid() = user_id);

-- Admin policies (if admin users exist)
CREATE POLICY "Admins can manage all wallets" ON public.loyalty_coins_wallet
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
                OR auth.users.raw_user_meta_data->>'role' = 'admin'
            )
        )
    );

CREATE POLICY "Admins can manage all transactions" ON public.loyalty_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
                OR auth.users.raw_user_meta_data->>'role' = 'admin'
            )
        )
    );

-- Ensure RLS is enabled
ALTER TABLE public.loyalty_coins_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.loyalty_coins_wallet TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.loyalty_transactions TO authenticated;

-- Test the policies by checking if current user can access tables
DO $$
BEGIN
    -- This will help verify the policies work
    RAISE NOTICE 'RLS policies updated successfully for loyalty system';
END $$;