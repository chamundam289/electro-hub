-- Sample Affiliate User Insert Query
-- Run this in Supabase SQL Editor after running new_affiliate_system_v2.sql

-- Insert a test affiliate user
INSERT INTO public.affiliate_users (
    email,
    mobile,
    password_hash,
    full_name,
    status,
    created_by
) VALUES (
    'john.affiliate@example.com',
    '+91 9876543210',
    crypt('affiliate123', gen_salt('bf')),  -- Password: affiliate123
    'John Doe',
    'active',
    (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)  -- Uses first admin as creator
);

-- Alternative: If you don't have admin profiles yet, use this simpler version
-- INSERT INTO public.affiliate_users (
--     email,
--     mobile,
--     password_hash,
--     full_name,
--     status
-- ) VALUES (
--     'john.affiliate@example.com',
--     '+91 9876543210',
--     crypt('affiliate123', gen_salt('bf')),
--     'John Doe',
--     'active'
-- );

-- Verify the insert worked
SELECT 
    id,
    email,
    mobile,
    full_name,
    status,
    created_at
FROM public.affiliate_users 
WHERE email = 'john.affiliate@example.com';

-- Test affiliate login credentials:
-- Email: john.affiliate@example.com
-- Password: affiliate123