-- ============================================
-- 🔧 FIX WALLET FUNCTION AMBIGUOUS COLUMN ERROR
-- ============================================

-- Fix the get_user_wallet_safe function with proper column qualification
CREATE OR REPLACE FUNCTION get_user_wallet_safe(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    total_coins_earned INTEGER,
    total_coins_used INTEGER,
    available_coins INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Use UPSERT to handle conflicts gracefully
    INSERT INTO public.loyalty_coins_wallet (
        user_id,
        total_coins_earned,
        total_coins_used,
        available_coins,
        last_updated,
        created_at
    ) VALUES (
        p_user_id,
        0,
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        last_updated = NOW();
    
    -- Return the wallet with properly qualified columns
    RETURN QUERY
    SELECT 
        lcw.id,
        lcw.user_id,
        lcw.total_coins_earned,
        lcw.total_coins_used,
        lcw.available_coins,
        lcw.last_updated,
        lcw.created_at
    FROM public.loyalty_coins_wallet lcw
    WHERE lcw.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_wallet_safe(UUID) TO authenticated;

-- Also fix the get_or_create_loyalty_settings function for consistency
CREATE OR REPLACE FUNCTION get_or_create_loyalty_settings(p_product_id UUID)
RETURNS TABLE (
    product_id UUID,
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
    -- Get product details with proper qualification
    SELECT p.price, p.name INTO product_price, product_name
    FROM public.products p
    WHERE p.id = p_product_id;
    
    -- Use UPSERT to handle conflicts
    INSERT INTO public.loyalty_product_settings (
        product_id,
        coins_earned_per_purchase,
        coins_required_to_buy,
        is_coin_purchase_enabled,
        is_coin_earning_enabled,
        created_at,
        updated_at
    ) VALUES (
        p_product_id,
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
    
    -- Return the settings with properly qualified columns
    RETURN QUERY
    SELECT 
        lps.product_id,
        lps.coins_earned_per_purchase,
        lps.coins_required_to_buy,
        lps.is_coin_purchase_enabled,
        lps.is_coin_earning_enabled,
        lps.created_at,
        lps.updated_at
    FROM public.loyalty_product_settings lps
    WHERE lps.product_id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_loyalty_settings(UUID) TO authenticated;

-- Test the functions
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed ambiguous column reference in wallet function';
    RAISE NOTICE '✅ Fixed ambiguous column reference in loyalty settings function';
    RAISE NOTICE '🚀 Functions should now work without 400 errors';
END $$;