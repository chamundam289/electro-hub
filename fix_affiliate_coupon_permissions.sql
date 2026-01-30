-- ============================================
-- FIX AFFILIATE COUPON PERMISSIONS
-- ============================================

-- Disable RLS on affiliate tables for development
ALTER TABLE public.affiliate_users DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT SELECT ON public.affiliate_users TO authenticated, anon;

-- Create a test affiliate user for the admin email
INSERT INTO public.affiliate_users (
    name,
    mobile_number,
    password_hash,
    affiliate_code,
    is_active,
    created_at
) VALUES (
    'Admin User',
    'chamundam289@gmail.com',
    'dummy_hash', -- This won't be used for login
    'ADMIN001',
    true,
    now()
) ON CONFLICT (mobile_number) DO UPDATE SET
    name = EXCLUDED.name,
    affiliate_code = EXCLUDED.affiliate_code,
    is_active = EXCLUDED.is_active;

-- Also try with just the email part before @
INSERT INTO public.affiliate_users (
    name,
    mobile_number,
    password_hash,
    affiliate_code,
    is_active,
    created_at
) VALUES (
    'Admin User Alt',
    'chamundam289',
    'dummy_hash',
    'ADMIN002',
    true,
    now()
) ON CONFLICT (mobile_number) DO NOTHING;