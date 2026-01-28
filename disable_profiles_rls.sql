-- TEMPORARY FIX: Disable RLS on profiles table for testing
-- Run this in your Supabase SQL editor for immediate fix

-- Disable RLS to stop infinite recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;

-- Insert admin profile
INSERT INTO public.profiles (id, email, role, full_name, status)
SELECT id, email, 'admin', 'System Admin', 'active'
FROM auth.users 
WHERE email = 'chamundam289@gmail.com'  -- Change this to your admin email
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    status = 'active',
    updated_at = now();

-- This will allow the admin login to work immediately
-- You can re-enable RLS later with proper policies