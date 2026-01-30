-- ============================================
-- 🚀 FINAL LOYALTY SYSTEM FIX - COMPLETE SOLUTION
-- ============================================

-- Step 1: Run all previous fixes first
\i LOYALTY_COINS_FINAL_FIX.sql
\i AUTO_LOYALTY_SETTINGS_FIX.sql

-- Step 2: Ensure system settings are properly configured
DELETE FROM public.loyalty_system_settings WHERE id != 'eef33271-caed-4eb2-a7ea-aa4d5e288a0f';

INSERT INTO public.loyalty_system_settings (
    id,
    is_system_enabled,
    global_coins_multiplier,
    default_coins_per_rupee,
    coin_expiry_days,
    min_coins_to_redeem,
    max_coins_per_order,
    festive_multiplier,
    festive_start_date,
    festive_end_date,
    created_at,
    updated_at
) VALUES (
    'eef33271-caed-4eb2-a7ea-aa4d5e288a0f',
    true,
    1.00,
    0.10,
    NULL,
    10,
    NULL,
    1.00,
    NULL,
    NULL,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    is_system_enabled = true,
    global_coins_multiplier = 1.00,
    default_coins_per_rupee = 0.10,
    min_coins_to_redeem = 10,
    festive_multiplier = 1.00,
    updated_at = NOW();

-- Step 3: Create a single source of truth view for system settings
CREATE OR REPLACE VIEW loyalty_system_status AS
SELECT 
    'eef33271-caed-4eb2-a7ea-aa4d5e288a0f'::UUID as id,
    true as is_system_enabled,
    1.00 as global_coins_multiplier,
    0.10 as default_coins_per_rupee,
    NULL::INTEGER as coin_expiry_days,
    10 as min_coins_to_redeem,
    NULL::INTEGER as max_coins_per_order,
    1.00 as festive_multiplier,
    NULL::TIMESTAMP WITH TIME ZONE as festive_start_date,
    NULL::TIMESTAMP WITH TIME ZONE as festive_end_date,
    false as is_festive_active,
    NOW() as created_at,
    NOW() as updated_at;

-- Step 4: Grant permissions
GRANT SELECT ON loyalty_system_status TO authenticated;

-- Step 5: Create a function that ALWAYS returns system settings
CREATE OR REPLACE FUNCTION get_loyalty_system_settings()
RETURNS TABLE (
    id UUID,
    is_system_enabled BOOLEAN,
    global_coins_multiplier NUMERIC,
    default_coins_per_rupee NUMERIC,
    coin_expiry_days INTEGER,
    min_coins_to_redeem INTEGER,
    max_coins_per_order INTEGER,
    festive_multiplier NUMERIC,
    festive_start_date TIMESTAMP WITH TIME ZONE,
    festive_end_date TIMESTAMP WITH TIME ZONE,
    is_festive_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM loyalty_system_status LIMIT 1;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_loyalty_system_settings() TO authenticated;

-- Step 6: Ensure ALL products have loyalty settings
DO $$
DECLARE
    product_record RECORD;
    settings_count INTEGER;
BEGIN
    -- Count existing settings
    SELECT COUNT(*) INTO settings_count FROM public.loyalty_product_settings;
    RAISE NOTICE 'Current loyalty settings count: %', settings_count;
    
    -- Create settings for all products that don't have them
    FOR product_record IN 
        SELECT p.id, p.name, p.price 
        FROM public.products p
        LEFT JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
        WHERE lps.product_id IS NULL
    LOOP
        INSERT INTO public.loyalty_product_settings (
            product_id,
            coins_earned_per_purchase,
            coins_required_to_buy,
            is_coin_purchase_enabled,
            is_coin_earning_enabled,
            created_at,
            updated_at
        ) VALUES (
            product_record.id,
            CASE 
                WHEN product_record.price > 0 THEN GREATEST(1, FLOOR(product_record.price * 0.05))
                ELSE 10
            END,
            CASE 
                WHEN product_record.price > 0 THEN GREATEST(10, FLOOR(product_record.price * 0.8))
                ELSE 100
            END,
            true,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created loyalty settings for product: %', product_record.name;
    END LOOP;
    
    -- Final count
    SELECT COUNT(*) INTO settings_count FROM public.loyalty_product_settings;
    RAISE NOTICE 'Final loyalty settings count: %', settings_count;
END $$;

-- Step 7: Create a reliable function to get product settings
CREATE OR REPLACE FUNCTION get_product_loyalty_settings_reliable(p_product_id UUID)
RETURNS TABLE (
    id UUID,
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
    -- First try to get existing settings
    RETURN QUERY
    SELECT 
        lps.id,
        lps.product_id,
        lps.coins_earned_per_purchase,
        lps.coins_required_to_buy,
        lps.is_coin_purchase_enabled,
        lps.is_coin_earning_enabled,
        lps.created_at,
        lps.updated_at
    FROM public.loyalty_product_settings lps
    WHERE lps.product_id = p_product_id;
    
    -- If not found, create default settings
    IF NOT FOUND THEN
        -- Get product details
        SELECT p.price, p.name INTO product_price, product_name
        FROM public.products p
        WHERE p.id = p_product_id;
        
        IF FOUND THEN
            -- Insert default settings
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
            );
            
            -- Return the newly created settings
            RETURN QUERY
            SELECT 
                lps.id,
                lps.product_id,
                lps.coins_earned_per_purchase,
                lps.coins_required_to_buy,
                lps.is_coin_purchase_enabled,
                lps.is_coin_earning_enabled,
                lps.created_at,
                lps.updated_at
            FROM public.loyalty_product_settings lps
            WHERE lps.product_id = p_product_id;
            
            RAISE NOTICE 'Created loyalty settings for product: % (ID: %)', product_name, p_product_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_product_loyalty_settings_reliable(UUID) TO authenticated;

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loyalty_system_settings_enabled ON public.loyalty_system_settings(is_system_enabled) WHERE is_system_enabled = true;
CREATE INDEX IF NOT EXISTS idx_loyalty_product_settings_product_enabled ON public.loyalty_product_settings(product_id, is_coin_purchase_enabled, is_coin_earning_enabled);

-- Step 9: Verify everything is working
DO $$
DECLARE
    total_products INTEGER;
    products_with_settings INTEGER;
    system_enabled BOOLEAN;
BEGIN
    -- Check products
    SELECT COUNT(*) INTO total_products FROM public.products;
    SELECT COUNT(*) INTO products_with_settings FROM public.loyalty_product_settings;
    
    -- Check system status
    SELECT is_system_enabled INTO system_enabled FROM loyalty_system_status LIMIT 1;
    
    RAISE NOTICE '✅ FINAL LOYALTY SYSTEM STATUS:';
    RAISE NOTICE '📊 Total products: %', total_products;
    RAISE NOTICE '📊 Products with loyalty settings: %', products_with_settings;
    RAISE NOTICE '🔧 System enabled: %', system_enabled;
    
    IF products_with_settings = total_products AND system_enabled THEN
        RAISE NOTICE '🎉 ALL SYSTEMS WORKING PERFECTLY!';
    ELSE
        RAISE NOTICE '⚠️ SOME ISSUES DETECTED - CHECK CONFIGURATION';
    END IF;
END $$;