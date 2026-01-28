-- User-Side Database Enhancements
-- This script adds user-specific features and improvements to support the customer portal

-- Create users table for customer accounts
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NO    L,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    profile_picture_url TEXT,
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    is_verified BOOLEAN DEFAULT FALSE,
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table for login management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info TEXT,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_addresses table for multiple delivery addresses
CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    address_type VARCHAR(50) DEFAULT 'home', -- home, office, other
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    landmark TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_favorites table for wishlist functionality
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID, -- References products table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create loyalty_transactions table for points tracking
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- earned, redeemed, expired
    points INTEGER NOT NULL,
    reference_type VARCHAR(50), -- order, recharge, repair, referral
    reference_id UUID,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
    category VARCHAR(50), -- order, recharge, repair, promotion
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recharge_plans table for dynamic plan management
CREATE TABLE IF NOT EXISTS recharge_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator VARCHAR(100) NOT NULL,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('prepaid', 'postpaid')),
    amount DECIMAL(10,2) NOT NULL,
    validity_days INTEGER,
    description TEXT NOT NULL,
    data_limit VARCHAR(50),
    call_benefits TEXT,
    sms_benefits TEXT,
    additional_benefits TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create repair_service_types table for dynamic repair services
CREATE TABLE IF NOT EXISTS repair_service_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    service_icon VARCHAR(10),
    description TEXT,
    estimated_time_min INTEGER, -- in minutes
    estimated_time_max INTEGER, -- in minutes
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    warranty_days INTEGER DEFAULT 30,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offers table for promotions and cashback
CREATE TABLE IF NOT EXISTS offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    offer_type VARCHAR(50) NOT NULL, -- cashback, discount, bonus_points
    service_type VARCHAR(50), -- recharge, repair, product, all
    discount_type VARCHAR(20), -- percentage, fixed_amount
    discount_value DECIMAL(10,2),
    min_amount DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    offer_code VARCHAR(50) UNIQUE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    user_usage_limit INTEGER DEFAULT 1,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_offer_usage table to track offer usage
CREATE TABLE IF NOT EXISTS user_offer_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    reference_type VARCHAR(50), -- order, recharge, repair
    reference_id UUID,
    discount_amount DECIMAL(10,2),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, offer_id, reference_id)
);

-- Add user_id to mobile_recharges for user tracking
ALTER TABLE mobile_recharges ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE mobile_recharges ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES offers(id);
ALTER TABLE mobile_recharges ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE mobile_recharges ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER DEFAULT 0;

-- Add user_id to mobile_repairs for user tracking
ALTER TABLE mobile_repairs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE mobile_repairs ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES offers(id);
ALTER TABLE mobile_repairs ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE mobile_repairs ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER DEFAULT 0;
ALTER TABLE mobile_repairs ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE mobile_repairs ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE mobile_repairs ADD COLUMN IF NOT EXISTS pickup_requested BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_plans_operator ON recharge_plans(operator, plan_type);
CREATE INDEX IF NOT EXISTS idx_offers_code ON offers(offer_code);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_mobile_recharges_user_id ON mobile_recharges(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_repairs_user_id ON mobile_repairs(user_id);

-- Enable Row Level Security for user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Create RLS policies for user_addresses
CREATE POLICY "Users can manage own addresses" ON user_addresses
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Create RLS policies for user_favorites
CREATE POLICY "Users can manage own favorites" ON user_favorites
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Create RLS policies for loyalty_transactions
CREATE POLICY "Users can view own loyalty transactions" ON loyalty_transactions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Create RLS policies for user_notifications
CREATE POLICY "Users can manage own notifications" ON user_notifications
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Allow public read access to plans and services
CREATE POLICY "Public can view recharge plans" ON recharge_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view repair services" ON repair_service_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active offers" ON offers
    FOR SELECT USING (is_active = true AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW()));

-- Insert sample recharge plans
INSERT INTO recharge_plans (operator, plan_type, amount, validity_days, description, data_limit, call_benefits, is_popular) VALUES
('Airtel', 'prepaid', 99, 28, 'Unlimited calls + 1GB/day', '1GB/day', 'Unlimited local/STD calls', false),
('Airtel', 'prepaid', 149, 28, 'Unlimited calls + 1.5GB/day', '1.5GB/day', 'Unlimited local/STD calls', true),
('Airtel', 'prepaid', 199, 28, 'Unlimited calls + 2GB/day', '2GB/day', 'Unlimited local/STD calls', true),
('Airtel', 'prepaid', 299, 28, 'Unlimited calls + 2.5GB/day', '2.5GB/day', 'Unlimited local/STD calls', false),
('Jio', 'prepaid', 99, 28, 'Unlimited calls + 1GB/day', '1GB/day', 'Unlimited local/STD calls', false),
('Jio', 'prepaid', 149, 28, 'Unlimited calls + 1.5GB/day', '1.5GB/day', 'Unlimited local/STD calls', true),
('Jio', 'prepaid', 199, 28, 'Unlimited calls + 2GB/day', '2GB/day', 'Unlimited local/STD calls', true),
('Vi', 'prepaid', 99, 28, 'Unlimited calls + 1GB/day', '1GB/day', 'Unlimited local/STD calls', false),
('Vi', 'prepaid', 149, 28, 'Unlimited calls + 1.5GB/day', '1.5GB/day', 'Unlimited local/STD calls', true);

-- Insert sample repair service types
INSERT INTO repair_service_types (service_name, service_icon, description, estimated_time_min, estimated_time_max, price_min, price_max, is_popular) VALUES
('Screen Replacement', '📱', 'Cracked or damaged screen repair', 120, 240, 2000, 15000, true),
('Battery Replacement', '🔋', 'Battery not holding charge', 60, 120, 1500, 5000, true),
('Charging Port Repair', '🔌', 'Charging port not working', 120, 180, 1000, 3000, false),
('Camera Repair', '📷', 'Camera not working or blurry', 180, 300, 2500, 8000, false),
('Speaker Repair', '🔊', 'No sound or distorted audio', 60, 180, 800, 2500, false),
('Water Damage Repair', '💧', 'Phone got wet or water damaged', 1440, 4320, 3000, 12000, false);

-- Insert sample offers
INSERT INTO offers (title, description, offer_type, service_type, discount_type, discount_value, min_amount, offer_code, usage_limit, valid_until) VALUES
('Welcome Bonus', '10% cashback on first recharge', 'cashback', 'recharge', 'percentage', 10, 100, 'WELCOME10', 1000, NOW() + INTERVAL '30 days'),
('Repair Discount', '₹500 off on mobile repairs', 'discount', 'repair', 'fixed_amount', 500, 2000, 'REPAIR500', 500, NOW() + INTERVAL '15 days'),
('Festival Offer', '15% off on all services', 'discount', 'all', 'percentage', 15, 200, 'FESTIVAL15', 2000, NOW() + INTERVAL '7 days');

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updated_at();

CREATE TRIGGER update_user_addresses_updated_at
    BEFORE UPDATE ON user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updated_at();

CREATE TRIGGER update_recharge_plans_updated_at
    BEFORE UPDATE ON recharge_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updated_at();

CREATE TRIGGER update_repair_service_types_updated_at
    BEFORE UPDATE ON repair_service_types
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updated_at();

CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updated_at();

-- Grant necessary permissions
GRANT SELECT ON recharge_plans TO anon, authenticated;
GRANT SELECT ON repair_service_types TO anon, authenticated;
GRANT SELECT ON offers TO anon, authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_sessions TO authenticated;
GRANT ALL ON user_addresses TO authenticated;
GRANT ALL ON user_favorites TO authenticated;
GRANT ALL ON loyalty_transactions TO authenticated;
GRANT ALL ON user_notifications TO authenticated;
GRANT ALL ON user_offer_usage TO authenticated;

COMMENT ON TABLE users IS 'Customer user accounts with profile information';
COMMENT ON TABLE user_sessions IS 'User login sessions for authentication';
COMMENT ON TABLE user_addresses IS 'Multiple delivery addresses for users';
COMMENT ON TABLE user_favorites IS 'User wishlist/favorites for products';
COMMENT ON TABLE loyalty_transactions IS 'Loyalty points earning and redemption history';
COMMENT ON TABLE user_notifications IS 'User notifications and alerts';
COMMENT ON TABLE recharge_plans IS 'Dynamic mobile recharge plans by operator';
COMMENT ON TABLE repair_service_types IS 'Available mobile repair services';
COMMENT ON TABLE offers IS 'Promotional offers and discounts';
COMMENT ON TABLE user_offer_usage IS 'Track user usage of promotional offers';