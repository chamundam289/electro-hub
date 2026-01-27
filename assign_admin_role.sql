-- Quick fix: Assign admin role to the user
-- Run this directly in Supabase SQL Editor

INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' FROM auth.users WHERE email = 'chamundam289@gmail.com'
ON CONFLICT DO NOTHING;

-- Verify the role was assigned
SELECT u.email, ur.role 
FROM auth.users u 
LEFT JOIN public.user_roles ur ON u.id = ur.user_id 
WHERE u.email = 'chamundam289@gmail.com';