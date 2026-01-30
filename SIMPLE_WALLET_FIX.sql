-- ============================================
-- 🔧 SIMPLE WALLET FIX - NO TESTS, NO FOREIGN KEY ISSUES
-- ============================================

-- Drop the problematic function
DROP FUNCTION IF EXISTS get_user_wallet_safe(UUID);

-- Create a simple, safe wallet function
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
BEGIN
    -- Try to get existing wallet first
    RETURN QUERY
    SELECT 
        w.id AS wallet_id,
        w.user_id AS wallet_user_id,
        w.total_coins_earned,
        w.total_coins_used,
        w.available_coins,
        w.last_updated,
        w.created_at
    FROM public.loyalty_coins_wallet AS w
    WHERE w.user_id = input_user_id;
    
    -- If no wallet found, try to create one (only if user exists)
    IF NOT FOUND THEN
        -- Only create wallet if user exists in auth.users
        IF EXISTS(SELECT 1 FROM auth.users WHERE id = input_user_id) THEN
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
            
            -- Return the newly created wallet
            RETURN QUERY
            SELECT 
                w.id AS wallet_id,
                w.user_id AS wallet_user_id,
                w.total_coins_earned,
                w.total_coins_used,
                w.available_coins,
                w.last_updated,
                w.created_at
            FROM public.loyalty_coins_wallet AS w
            WHERE w.user_id = input_user_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_wallet_safe(UUID) TO authenticated;

-- Also fix the loyalty settings function
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
BEGIN
    -- Try to get existing settings first
    RETURN QUERY
    SELECT 
        lps.product_id AS settings_product_id,
        lps.coins_earned_per_purchase,
        lps.coins_required_to_buy,
        lps.is_coin_purchase_enabled,
        lps.is_coin_earning_enabled,
        lps.created_at,
        lps.updated_at
    FROM public.loyalty_product_settings AS lps
    WHERE lps.product_id = input_product_id;
    
    -- If no settings found, create them
    IF NOT FOUND THEN
        -- Get product price
        SELECT p.price INTO product_price
        FROM public.products AS p
        WHERE p.id = input_product_id;
        
        -- Only create if product exists
        IF product_price IS NOT NULL THEN
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
            
            -- Return the newly created settings
            RETURN QUERY
            SELECT 
                lps.product_id AS settings_product_id,
                lps.coins_earned_per_purchase,
                lps.coins_required_to_buy,
                lps.is_coin_purchase_enabled,
                lps.is_coin_earning_enabled,
                lps.created_at,
                lps.updated_at
            FROM public.loyalty_product_settings AS lps
            WHERE lps.product_id = input_product_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_loyalty_settings(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Simple wallet functions created successfully';
    RAISE NOTICE '🔧 Fixed: Ambiguous column references';
    RAISE NOTICE '🔧 Fixed: Foreign key constraint issues';
    RAISE NOTICE '🔧 Added: User existence checks';
    RAISE NOTICE '🚀 Functions ready for production use';
END $$;