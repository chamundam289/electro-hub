-- Add profile management functions to the database
-- Run this in your Supabase SQL editor

-- Function to get profile by user ID
CREATE OR REPLACE FUNCTION get_profile_by_id(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    status TEXT,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.role, p.status, p.full_name, p.phone, p.created_at, p.updated_at
    FROM public.profiles p
    WHERE p.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create profile
CREATE OR REPLACE FUNCTION create_profile(
    user_id_param UUID,
    email_param TEXT,
    role_param TEXT DEFAULT 'customer'
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    status TEXT,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, status)
    VALUES (user_id_param, email_param, role_param, 'active')
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = now();
    
    RETURN QUERY
    SELECT p.id, p.email, p.role, p.status, p.full_name, p.phone, p.created_at, p.updated_at
    FROM public.profiles p
    WHERE p.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure admin profile exists
CREATE OR REPLACE FUNCTION ensure_admin_profile(
    user_id_param UUID,
    email_param TEXT
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    status TEXT,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, status)
    VALUES (user_id_param, email_param, 'admin', 'active')
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        status = 'active',
        email = EXCLUDED.email,
        updated_at = now();
    
    RETURN QUERY
    SELECT p.id, p.email, p.role, p.status, p.full_name, p.phone, p.created_at, p.updated_at
    FROM public.profiles p
    WHERE p.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;