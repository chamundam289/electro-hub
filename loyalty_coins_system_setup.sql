-- ============================================
-- 🪙 LOYALTY COINS SYSTEM - DATABASE SETUP
-- ============================================

-- 1. Create loyalty_coins_wallet table (User's coin balance)
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

-- 2. Create loyalty_transactions table (Transaction history)
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'manual_add', 'manual_remove')),
    coins_amount INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'product_purchase', 'admin_adjustment'
    reference_id UUID, -- order_id or product_id
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT,
    description TEXT,
    admin_notes TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Create loyalty_product_settings table (Product-wise coin configuration)
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

-- 4. Create loyalty_system_settings table (Global system settings)
CREATE TABLE IF NOT EXISTS public.loyalty_system_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    is_system_enabled BOOLEAN NOT NULL DEFAULT true,
    global_coins_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    default_coins_per_rupee DECIMAL(5,2) NOT NULL DEFAULT 0.10, -- 1 coin per ₹10
    coin_expiry_days INTEGER DEFAULT NULL, -- NULL means no expiry
    min_coins_to_redeem INTEGER NOT NULL DEFAULT 10,
    max_coins_per_order INTEGER DEFAULT NULL, -- NULL means no limit
    festive_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    festive_start_date TIMESTAMP WITH TIME ZONE,
    festive_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Add loyalty columns to existing orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coins_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS coins_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS coins_discount_amount DECIMAL(10,2) DEFAULT 0.00;

-- 6. Add loyalty columns to existing products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS coins_earned_per_purchase INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS coins_required_to_buy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_coin_purchase_enabled BOOLEAN DEFAULT false;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_loyalty_coins_wallet_user_id ON public.loyalty_coins_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON public.loyalty_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order_id ON public.loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON public.loyalty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_product_settings_product_id ON public.loyalty_product_settings(product_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all loyalty tables
ALTER TABLE public.loyalty_coins_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_product_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_system_settings ENABLE ROW LEVEL SECURITY;

-- Loyalty Coins Wallet Policies
CREATE POLICY "Users can view own wallet" ON public.loyalty_coins_wallet
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.loyalty_coins_wallet
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Loyalty Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.loyalty_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON public.loyalty_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Loyalty Product Settings Policies
CREATE POLICY "Anyone can view product loyalty settings" ON public.loyalty_product_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage product loyalty settings" ON public.loyalty_product_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Loyalty System Settings Policies
CREATE POLICY "Anyone can view system settings" ON public.loyalty_system_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage system settings" ON public.loyalty_system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to calculate coins earned for an order
CREATE OR REPLACE FUNCTION calculate_coins_earned(order_total DECIMAL, user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    system_settings RECORD;
    coins_earned INTEGER;
BEGIN
    -- Get system settings
    SELECT * INTO system_settings FROM public.loyalty_system_settings LIMIT 1;
    
    -- If system is disabled, return 0
    IF NOT system_settings.is_system_enabled THEN
        RETURN 0;
    END IF;
    
    -- Calculate base coins
    coins_earned := FLOOR(order_total * system_settings.default_coins_per_rupee);
    
    -- Apply global multiplier
    coins_earned := FLOOR(coins_earned * system_settings.global_coins_multiplier);
    
    -- Apply festive multiplier if active
    IF system_settings.festive_start_date IS NOT NULL 
       AND system_settings.festive_end_date IS NOT NULL 
       AND NOW() BETWEEN system_settings.festive_start_date AND system_settings.festive_end_date THEN
        coins_earned := FLOOR(coins_earned * system_settings.festive_multiplier);
    END IF;
    
    -- Apply max coins per order limit
    IF system_settings.max_coins_per_order IS NOT NULL 
       AND coins_earned > system_settings.max_coins_per_order THEN
        coins_earned := system_settings.max_coins_per_order;
    END IF;
    
    RETURN COALESCE(coins_earned, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update user coin wallet
CREATE OR REPLACE FUNCTION update_user_coin_wallet(
    p_user_id UUID,
    p_coins_change INTEGER,
    p_transaction_type VARCHAR(20)
)
RETURNS VOID AS $$
BEGIN
    -- Insert or update wallet
    INSERT INTO public.loyalty_coins_wallet (user_id, total_coins_earned, total_coins_used, available_coins)
    VALUES (
        p_user_id,
        CASE WHEN p_transaction_type IN ('earned', 'manual_add') THEN p_coins_change ELSE 0 END,
        CASE WHEN p_transaction_type IN ('redeemed', 'manual_remove') THEN ABS(p_coins_change) ELSE 0 END,
        CASE 
            WHEN p_transaction_type IN ('earned', 'manual_add') THEN p_coins_change
            WHEN p_transaction_type IN ('redeemed', 'manual_remove') THEN -ABS(p_coins_change)
            ELSE 0
        END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_coins_earned = loyalty_coins_wallet.total_coins_earned + 
            CASE WHEN p_transaction_type IN ('earned', 'manual_add') THEN p_coins_change ELSE 0 END,
        total_coins_used = loyalty_coins_wallet.total_coins_used + 
            CASE WHEN p_transaction_type IN ('redeemed', 'manual_remove') THEN ABS(p_coins_change) ELSE 0 END,
        available_coins = loyalty_coins_wallet.available_coins + 
            CASE 
                WHEN p_transaction_type IN ('earned', 'manual_add') THEN p_coins_change
                WHEN p_transaction_type IN ('redeemed', 'manual_remove') THEN -ABS(p_coins_change)
                ELSE 0
            END,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- ============================================

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
    0.10, -- 1 coin per ₹10 spent
    NULL, -- No expiry
    10,   -- Minimum 10 coins to redeem
    NULL, -- No maximum limit
    1.00  -- No festive bonus initially
) ON CONFLICT DO NOTHING;

-- ============================================
-- TRIGGERS FOR AUTOMATIC COIN PROCESSING
-- ============================================

-- Trigger function to process coins when order status changes
CREATE OR REPLACE FUNCTION process_order_coins()
RETURNS TRIGGER AS $$
DECLARE
    coins_to_award INTEGER;
    user_uuid UUID;
BEGIN
    -- Only process when order status changes to 'delivered' or 'completed'
    IF NEW.status IN ('delivered', 'completed') AND (OLD.status IS NULL OR OLD.status NOT IN ('delivered', 'completed')) THEN
        
        -- Get user ID from customer_phone (which stores email)
        SELECT id INTO user_uuid FROM auth.users WHERE email = NEW.customer_phone;
        
        IF user_uuid IS NOT NULL THEN
            -- Calculate coins to award
            coins_to_award := calculate_coins_earned(NEW.total_amount, user_uuid);
            
            IF coins_to_award > 0 THEN
                -- Update order with coins earned
                NEW.coins_earned := coins_to_award;
                
                -- Add transaction record
                INSERT INTO public.loyalty_transactions (
                    user_id, transaction_type, coins_amount, reference_type, 
                    reference_id, order_id, description
                ) VALUES (
                    user_uuid, 'earned', coins_to_award, 'order',
                    NEW.id, NEW.id, 
                    'Coins earned from order #' || COALESCE(NEW.invoice_number, NEW.id::text)
                );
                
                -- Update user wallet
                PERFORM update_user_coin_wallet(user_uuid, coins_to_award, 'earned');
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_process_order_coins ON public.orders;
CREATE TRIGGER trigger_process_order_coins
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION process_order_coins();

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Add loyalty settings for existing products (optional)
INSERT INTO public.loyalty_product_settings (product_id, coins_earned_per_purchase, coins_required_to_buy, is_coin_purchase_enabled)
SELECT 
    id as product_id,
    FLOOR(price * 0.05) as coins_earned_per_purchase, -- 5% of price as coins
    FLOOR(price * 0.8) as coins_required_to_buy,      -- 80% of price in coins
    true as is_coin_purchase_enabled
FROM public.products 
WHERE price > 0
ON CONFLICT (product_id) DO NOTHING;

COMMENT ON TABLE public.loyalty_coins_wallet IS 'Stores user coin balances and totals';
COMMENT ON TABLE public.loyalty_transactions IS 'Records all coin earning and spending transactions';
COMMENT ON TABLE public.loyalty_product_settings IS 'Product-specific coin earning and redemption settings';
COMMENT ON TABLE public.loyalty_system_settings IS 'Global loyalty system configuration';