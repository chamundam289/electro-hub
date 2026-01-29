-- ADMIN SETUP INSTRUCTIONS FOR SUPABASE
-- Email: chamundam289@gmail.com
-- Password: chamunda@321

-- IMPORTANT: You cannot set passwords directly via SQL in Supabase for security reasons.
-- Follow these steps instead:

-- STEP 1: Go to your Supabase Dashboard
-- 1. Open https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to Authentication > Users

-- STEP 2: Find or Create the User
-- Option A: If user already exists (from Google login):
--   1. Find user with email: chamundam289@gmail.com
--   2. Click on the user
--   3. Click "Reset Password" or "Set Password"
--   4. Set password to: chamunda@321

-- Option B: If user doesn't exist:
--   1. Click "Add User" button
--   2. Email: chamundam289@gmail.com
--   3. Password: chamunda@321
--   4. Click "Add User"

-- STEP 3: Verify Admin Access
-- The user chamundam289@gmail.com is already configured as admin in the code:
-- AuthContext.tsx line: user?.email === 'chamundam289@gmail.com'

-- STEP 4: Test Login
-- 1. Go to your app's /admin/login page
-- 2. Enter email: chamundam289@gmail.com
-- 3. Enter password: chamunda@321
-- 4. Click "Sign In"

-- ALTERNATIVE: If you want to use Supabase CLI (if you have it installed):
-- supabase auth users create chamundam289@gmail.com --password chamunda@321

-- VERIFICATION QUERY (run this after setting up the user):
-- This will show all users in your auth system
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'chamundam289@gmail.com';

-- OPTIONAL: Create admin roles table for better admin management
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    permissions TEXT[] DEFAULT '{"all"}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access for authenticated users" ON public.admin_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow full access for service role" ON public.admin_users FOR ALL TO service_role USING (true);

-- After creating the user in Supabase Dashboard, run this to add them to admin_users table:
-- (Replace 'USER_ID_FROM_AUTH_USERS' with the actual UUID from auth.users table)
/*
INSERT INTO public.admin_users (user_id, email, role, permissions) 
VALUES (
    (SELECT id FROM auth.users WHERE email = 'chamundam289@gmail.com'),
    'chamundam289@gmail.com', 
    'super_admin', 
    '{"all", "users", "orders", "products", "shipping", "reports"}'
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    updated_at = now();
*/