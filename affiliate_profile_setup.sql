-- ============================================
-- 🤝 AFFILIATE PROFILE SETUP
-- ============================================

-- Create affiliate profiles table
CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    mobile_number TEXT,
    date_of_birth DATE,
    profile_image_url TEXT,
    bio TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',
    bank_account_number TEXT,
    bank_ifsc_code TEXT,
    bank_account_holder_name TEXT,
    pan_number TEXT,
    aadhar_number TEXT,
    is_profile_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user_id ON public.affiliate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_mobile ON public.affiliate_profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_complete ON public.affiliate_profiles(is_profile_complete);

-- Enable RLS
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Affiliates can view own profile" ON public.affiliate_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Affiliates can create own profile" ON public.affiliate_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Affiliates can update own profile" ON public.affiliate_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all profiles
CREATE POLICY "Admins can view all affiliate profiles" ON public.affiliate_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Create function to auto-create profile for new affiliates
CREATE OR REPLACE FUNCTION create_affiliate_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create profile if user is an affiliate
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = NEW.id AND role = 'affiliate'
    ) THEN
        INSERT INTO public.affiliate_profiles (
            user_id,
            full_name,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto profile creation
DROP TRIGGER IF EXISTS trigger_create_affiliate_profile ON auth.users;
CREATE TRIGGER trigger_create_affiliate_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_affiliate_profile_on_signup();

-- Create function to get or create affiliate profile
CREATE OR REPLACE FUNCTION get_or_create_affiliate_profile(input_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    mobile_number TEXT,
    date_of_birth DATE,
    profile_image_url TEXT,
    bio TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    bank_account_number TEXT,
    bank_ifsc_code TEXT,
    bank_account_holder_name TEXT,
    pan_number TEXT,
    aadhar_number TEXT,
    is_profile_complete BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Try to get existing profile
    RETURN QUERY
    SELECT 
        ap.id,
        ap.user_id,
        ap.full_name,
        ap.mobile_number,
        ap.date_of_birth,
        ap.profile_image_url,
        ap.bio,
        ap.address,
        ap.city,
        ap.state,
        ap.postal_code,
        ap.country,
        ap.bank_account_number,
        ap.bank_ifsc_code,
        ap.bank_account_holder_name,
        ap.pan_number,
        ap.aadhar_number,
        ap.is_profile_complete,
        ap.created_at,
        ap.updated_at
    FROM public.affiliate_profiles ap
    WHERE ap.user_id = input_user_id;
    
    -- If no profile found, create one
    IF NOT FOUND THEN
        -- Get user details from auth.users
        SELECT au.email, COALESCE(au.raw_user_meta_data->>'full_name', au.email)
        INTO user_email, user_name
        FROM auth.users au
        WHERE au.id = input_user_id;
        
        -- Create profile if user exists and is affiliate
        IF user_email IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = input_user_id AND role = 'affiliate'
        ) THEN
            INSERT INTO public.affiliate_profiles (
                user_id,
                full_name,
                created_at,
                updated_at
            ) VALUES (
                input_user_id,
                user_name,
                NOW(),
                NOW()
            );
            
            -- Return the newly created profile
            RETURN QUERY
            SELECT 
                ap.id,
                ap.user_id,
                ap.full_name,
                ap.mobile_number,
                ap.date_of_birth,
                ap.profile_image_url,
                ap.bio,
                ap.address,
                ap.city,
                ap.state,
                ap.postal_code,
                ap.country,
                ap.bank_account_number,
                ap.bank_ifsc_code,
                ap.bank_account_holder_name,
                ap.pan_number,
                ap.aadhar_number,
                ap.is_profile_complete,
                ap.created_at,
                ap.updated_at
            FROM public.affiliate_profiles ap
            WHERE ap.user_id = input_user_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_affiliate_profile(UUID) TO authenticated;

-- Create function to update profile completion status
CREATE OR REPLACE FUNCTION update_profile_completion_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if profile is complete
    NEW.is_profile_complete := (
        NEW.full_name IS NOT NULL AND
        NEW.mobile_number IS NOT NULL AND
        NEW.date_of_birth IS NOT NULL AND
        NEW.address IS NOT NULL AND
        NEW.city IS NOT NULL AND
        NEW.state IS NOT NULL
    );
    
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile completion
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON public.affiliate_profiles;
CREATE TRIGGER trigger_update_profile_completion
    BEFORE UPDATE ON public.affiliate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion_status();

-- Create existing affiliate profiles for current affiliates
INSERT INTO public.affiliate_profiles (user_id, full_name, created_at, updated_at)
SELECT 
    ur.user_id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    NOW(),
    NOW()
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE ur.role = 'affiliate'
ON CONFLICT (user_id) DO NOTHING;

-- Success message
DO $$
DECLARE
    affiliate_count INTEGER;
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO affiliate_count FROM public.user_roles WHERE role = 'affiliate';
    SELECT COUNT(*) INTO profile_count FROM public.affiliate_profiles;
    
    RAISE NOTICE '✅ Affiliate Profile System Setup Complete!';
    RAISE NOTICE '👥 Total affiliates: %', affiliate_count;
    RAISE NOTICE '📋 Profiles created: %', profile_count;
    RAISE NOTICE '🔧 Features: Profile image, personal info, banking details';
    RAISE NOTICE '🔧 Auto-completion tracking and validation';
    RAISE NOTICE '🚀 Ready for affiliate profile management!';
END $$;