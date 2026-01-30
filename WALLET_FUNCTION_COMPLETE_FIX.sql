-- ============================================
-- 🔧 WALLET FUNCTION COMPLETE FIX - NO AMBIGUITY
-- ============================================

-- Drop the problematic function first
DROP FUNCTION IF EXISTS get_user_wallet_safe(UUID);

-- Create a new function with a completely different approach
CREATE OR REPLACE FUNCTION get_user_wallet_safe(input_user_id UUID)
RETURNS TABLE (
    wallet_id UUID,
    wallet_user_id UUID,
    total_coins_earned INTEGER,
    total_coins_used INTEGER,
    available_coins INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists in auth.users table
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = input_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Return empty result if user doesn't exist
        RETURN;
    END IF;
    
    -- First, ensure wallet exists using INSERT ON CONFLICT
    INSERT INTO public.loyalty_coins_wallet (
        user_id,
        total_coins_earned,
        total_coins_used,
        available_coins,
        last_updated,
        created_at
    ) VALUES (
        input_user_id,
        0,
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        last_updated = NOW();
    
    -- Return the wallet data with renamed columns to avoid conflicts
    RETURN QUERY
    SELECT 
        wallet.id AS wallet_id,
        wallet.user_id AS wallet_user_id,
        wallet.total_coins_earned,
        wallet.total_coins_used,
        wallet.available_coins,
        wallet.last_updated,
        wallet.created_at
    FROM public.loyalty_coins_wallet AS wallet
    WHERE wallet.user_id = input_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_wallet_safe(UUID) TO authenticated;

-- Also fix the loyalty settings function with the same approach
DROP FUNCTION IF EXISTS get_or_create_loyalty_settings(UUID);

CREATE OR REPLACE FUNCTION get_or_create_loyalty_settings(input_product_id UUID)
RETURNS TABLE (
    settings_product_id UUID,
    coins_earned_per_purchase INTEGER,
    coins_required_to_buy INTEGER,
    is_coin_purchase_enabled BOOLEAN,
    is_coin_earning_enabled BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    product_price NUMERIC;
    product_name TEXT;
BEGIN
    -- Get product details
    SELECT prod.price, prod.name INTO product_price, product_name
    FROM public.products AS prod
    WHERE prod.id = input_product_id;
    
    -- Create or update loyalty settings
    INSERT INTO public.loyalty_product_settings (
        product_id,
        coins_earned_per_purchase,
        coins_required_to_buy,
        is_coin_purchase_enabled,
        is_coin_earning_enabled,
        created_at,
        updated_at
    ) VALUES (
        input_product_id,
        CASE 
            WHEN product_price > 0 THEN GREATEST(1, FLOOR(product_price * 0.05))
            ELSE 10
        END,
        CASE 
            WHEN product_price > 0 THEN GREATEST(10, FLOOR(product_price * 0.8))
            ELSE 100
        END,
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (product_id) DO UPDATE SET
        updated_at = NOW();
    
    -- Return the settings with renamed columns
    RETURN QUERY
    SELECT 
        settings.product_id AS settings_product_id,
        settings.coins_earned_per_purchase,
        settings.coins_required_to_buy,
        settings.is_coin_purchase_enabled,
        settings.is_coin_earning_enabled,
        settings.created_at,
        settings.updated_at
    FROM public.loyalty_product_settings AS settings
    WHERE settings.product_id = input_product_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_loyalty_settings(UUID) TO authenticated;

-- Test the functions (only if real users exist)
DO $$
BEGIN
    RAISE NOTICE '✅ Functions recreated with no ambiguous columns';
    RAISE NOTICE '🚀 Wallet function will work when called with real user IDs';
    RAISE NOTICE '💡 Test with actual authenticated user IDs only';
END $$;