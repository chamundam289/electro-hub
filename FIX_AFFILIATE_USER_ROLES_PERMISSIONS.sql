-- Fix Affiliate User Roles Permissions and Functions
-- This fixes the 406 Not Acceptable error when checking affiliate status

-- First, ensure user_roles table exists with proper structure
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'affiliate', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Public can check affiliate status" ON user_roles;

-- Create comprehensive RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Allow public read access for affiliate status checking (needed for navbar)
CREATE POLICY "Public can check affiliate status" ON user_roles
    FOR SELECT USING (role = 'affiliate');

-- Create safe function to check affiliate status
CREATE OR REPLACE FUNCTION check_user_affiliate_status(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = check_user_id 
        AND role = 'affiliate'
    );
END;
$$;

-- Create safe function to get affiliate profile
CREATE OR REPLACE FUNCTION get_affiliate_profile_safe(profile_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    mobile_number TEXT,
    profile_image_url TEXT,
    date_of_birth DATE,
    bank_account_number TEXT,
    bank_ifsc_code TEXT,
    bank_account_holder_name TEXT,
    total_referrals INTEGER,
    total_earnings DECIMAL(10,2),
    available_balance DECIMAL(10,2),
    profile_completion_percentage INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is affiliate
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = profile_user_id 
        AND role = 'affiliate'
    ) THEN
        RETURN;
    END IF;

    -- Return affiliate profile data
    RETURN QUERY
    SELECT 
        ap.user_id,
        ap.full_name,
        ap.email,
        ap.mobile_number,
        ap.profile_image_url,
        ap.date_of_birth,
        ap.bank_account_number,
        ap.bank_ifsc_code,
        ap.bank_account_holder_name,
        ap.total_referrals,
        ap.total_earnings,
        ap.available_balance,
        ap.profile_completion_percentage,
        ap.created_at,
        ap.updated_at
    FROM affiliate_profiles ap
    WHERE ap.user_id = profile_user_id;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON user_roles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_user_affiliate_status(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_affiliate_profile_safe(UUID) TO anon, authenticated;

-- Ensure affiliate_profiles table has proper permissions
ALTER TABLE affiliate_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing affiliate_profiles policies
DROP POLICY IF EXISTS "Users can view their own affiliate profile" ON affiliate_profiles;
DROP POLICY IF EXISTS "Users can update their own affiliate profile" ON affiliate_profiles;
DROP POLICY IF EXISTS "Admins can manage all affiliate profiles" ON affiliate_profiles;

-- Create RLS policies for affiliate_profiles
CREATE POLICY "Users can view their own affiliate profile" ON affiliate_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate profile" ON affiliate_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affiliate profile" ON affiliate_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all affiliate profiles" ON affiliate_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Grant permissions on affiliate_profiles
GRANT SELECT, INSERT, UPDATE ON affiliate_profiles TO authenticated;

-- Create function to safely create affiliate user
CREATE OR REPLACE FUNCTION create_affiliate_user_safe(
    affiliate_email TEXT,
    affiliate_password TEXT,
    affiliate_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- This function should only be called by admins
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Create user would need to be done through Supabase Auth API
    -- This is a placeholder for the logic
    RETURN json_build_object(
        'success', false, 
        'error', 'User creation must be done through Supabase Auth API'
    );
END;
$$;

-- Update existing affiliate users to have proper roles
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT user_id, 'affiliate'
FROM affiliate_profiles ap
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = ap.user_id 
    AND ur.role = 'affiliate'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user_id ON affiliate_profiles(user_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Test the functions
DO $$
DECLARE
    test_result BOOLEAN;
    test_profile RECORD;
BEGIN
    -- Test affiliate status check function
    SELECT check_user_affiliate_status('00000000-0000-0000-0000-000000000000') INTO test_result;
    RAISE NOTICE 'Affiliate status check function working: %', test_result;
    
    -- Test profile function
    SELECT * FROM get_affiliate_profile_safe('00000000-0000-0000-0000-000000000000') INTO test_profile;
    RAISE NOTICE 'Affiliate profile function working';
    
    RAISE NOTICE 'All affiliate permission fixes applied successfully!';
END;
$$;