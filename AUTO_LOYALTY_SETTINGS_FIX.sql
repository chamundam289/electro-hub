-- ============================================
-- 🔧 AUTO LOYALTY SETTINGS FIX
-- ============================================

-- Fix 1: Create a trigger function to automatically create loyalty settings for new products
CREATE OR REPLACE FUNCTION auto_create_loyalty_settings_on_product_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically create loyalty settings for new products
    INSERT INTO public.loyalty_product_settings (
        product_id,
        coins_earned_per_purchase,
        coins_required_to_buy,
        is_coin_purchase_enabled,
        is_coin_earning_enabled,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        CASE 
            WHEN NEW.price > 0 THEN GREATEST(1, FLOOR(NEW.price * 0.05))
            ELSE 10
        END,
        CASE 
            WHEN NEW.price > 0 THEN GREATEST(10, FLOOR(NEW.price * 0.8))
            ELSE 100
        END,
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (product_id) DO UPDATE SET
        updated_at = NOW();
    
    RAISE NOTICE 'Auto-created loyalty settings for product: %', NEW.name;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix 2: Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_create_loyalty_settings ON public.products;
CREATE TRIGGER trigger_auto_create_loyalty_settings
    AFTER INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_loyalty_settings_on_product_insert();

-- Fix 3: Create a trigger for product updates (price changes)
CREATE OR REPLACE FUNCTION update_loyalty_settings_on_price_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update loyalty settings when product price changes
    IF OLD.price IS DISTINCT FROM NEW.price AND NEW.price > 0 THEN
        UPDATE public.loyalty_product_settings 
        SET 
            coins_earned_per_purchase = GREATEST(1, FLOOR(NEW.price * 0.05)),
            coins_required_to_buy = GREATEST(10, FLOOR(NEW.price * 0.8)),
            updated_at = NOW()
        WHERE product_id = NEW.id
          AND coins_earned_per_purchase = GREATEST(1, FLOOR(OLD.price * 0.05))
          AND coins_required_to_buy = GREATEST(10, FLOOR(OLD.price * 0.8));
        
        RAISE NOTICE 'Updated loyalty settings for product % due to price change: % -> %', NEW.name, OLD.price, NEW.price;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix 4: Create the price update trigger
DROP TRIGGER IF EXISTS trigger_update_loyalty_on_price_change ON public.products;
CREATE TRIGGER trigger_update_loyalty_on_price_change
    AFTER UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_settings_on_price_change();

-- Fix 5: Ensure all existing products have loyalty settings
INSERT INTO public.loyalty_product_settings (
    product_id,
    coins_earned_per_purchase,
    coins_required_to_buy,
    is_coin_purchase_enabled,
    is_coin_earning_enabled,
    created_at,
    updated_at
)
SELECT 
    p.id,
    CASE 
        WHEN p.price > 0 THEN GREATEST(1, FLOOR(p.price * 0.05))
        ELSE 10
    END,
    CASE 
        WHEN p.price > 0 THEN GREATEST(10, FLOOR(p.price * 0.8))
        ELSE 100
    END,
    true,
    true,
    NOW(),
    NOW()
FROM public.products p
LEFT JOIN public.loyalty_product_settings lps ON p.id = lps.product_id
WHERE lps.product_id IS NULL
ON CONFLICT (product_id) DO UPDATE SET
    updated_at = NOW();

-- Fix 6: Create a function to manually sync loyalty settings for a product
CREATE OR REPLACE FUNCTION sync_product_loyalty_settings(p_product_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    product_price NUMERIC;
    product_name TEXT;
BEGIN
    -- Get product details
    SELECT price, name INTO product_price, product_name
    FROM public.products 
    WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Product not found: %', p_product_id;
        RETURN FALSE;
    END IF;
    
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
        coins_earned_per_purchase = CASE 
            WHEN product_price > 0 THEN GREATEST(1, FLOOR(product_price * 0.05))
            ELSE 10
        END,
        coins_required_to_buy = CASE 
            WHEN product_price > 0 THEN GREATEST(10, FLOOR(product_price * 0.8))
            ELSE 100
        END,
        updated_at = NOW();
    
    RAISE NOTICE 'Synced loyalty settings for product: %', product_name;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fix 7: Grant permissions
GRANT EXECUTE ON FUNCTION sync_product_loyalty_settings(UUID) TO authenticated;

-- Fix 8: Create a function to get loyalty settings with auto-creation
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
BEGIN
    -- Try to get existing settings
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
    
    -- If not found, create them
    IF NOT FOUND THEN
        PERFORM sync_product_loyalty_settings(p_product_id);
        
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
    END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_or_create_loyalty_settings(UUID) TO authenticated;

-- Success message
DO $$
DECLARE
    total_products INTEGER;
    products_with_settings INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_products FROM public.products;
    SELECT COUNT(*) INTO products_with_settings FROM public.loyalty_product_settings;
    
    RAISE NOTICE '✅ Auto Loyalty Settings Fix Applied Successfully!';
    RAISE NOTICE '🔧 Created triggers for automatic loyalty settings creation';
    RAISE NOTICE '🔧 Created triggers for price change updates';
    RAISE NOTICE '🔧 Added manual sync functions';
    RAISE NOTICE '📊 Total products: %', total_products;
    RAISE NOTICE '📊 Products with loyalty settings: %', products_with_settings;
    RAISE NOTICE '🚀 All new products will automatically get loyalty settings!';
END $$;