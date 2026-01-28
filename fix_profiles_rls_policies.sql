-- Fix infinite recursion in profiles RLS policies
-- Run this in your Supabase SQL editor

-- First, drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Disable RLS temporarily to fix the issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read access for own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create a simple admin policy that doesn't cause recursion
-- This allows service role to manage all profiles
CREATE POLICY "Enable all access for service role" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Alternative: Create admin policy using a different approach
-- Uncomment this if you need admin users to see all profiles
-- CREATE POLICY "Enable admin access" ON public.profiles
--     FOR ALL USING (
--         auth.uid() IN (
--             SELECT id FROM auth.users 
--             WHERE email = 'chamundam289@gmail.com'  -- Replace with your admin email
--         )
--     );

-- Insert or update admin profile
INSERT INTO public.profiles (id, email, role, full_name, status)
SELECT id, email, 'admin', 'System Admin', 'active'
FROM auth.users 
WHERE email = 'chamundam289@gmail.com'  -- Change this to your admin email
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    status = 'active',
    updated_at = now();

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;