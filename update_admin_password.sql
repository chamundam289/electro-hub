-- UPDATE ADMIN PASSWORD SCRIPT
-- This will help you update the existing admin user password

-- STEP 1: Check if user exists
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'chamundam289@gmail.com';

-- STEP 2: Update password via Supabase Dashboard
-- Since you cannot directly update passwords via SQL for security reasons,
-- follow these steps:

-- METHOD 1: Via Supabase Dashboard (RECOMMENDED)
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to Authentication > Users
-- 4. Find user: chamundam289@gmail.com
-- 5. Click on the user row
-- 6. Look for "Reset Password" or "Update User" option
-- 7. Set new password to: chamunda@321
-- 8. Save changes

-- METHOD 2: Via Supabase Admin API (if you have admin access)
-- You can use the Supabase Admin API to update the password:
-- POST https://your-project.supabase.co/auth/v1/admin/users/{user_id}
-- Headers: 
--   Authorization: Bearer YOUR_SERVICE_ROLE_KEY
--   Content-Type: application/json
-- Body: {"password": "chamunda@321"}

-- METHOD 3: Delete and recreate user (LAST RESORT)
-- If above methods don't work, you can delete and recreate:
-- 1. Delete existing user from Supabase Dashboard
-- 2. Go to /admin/setup page in your app
-- 3. Use the "Create/Update Admin User" button
-- 4. It will create new user with email: chamundam289@gmail.com and password: chamunda@321

-- VERIFICATION: After updating password, test login
-- 1. Go to /admin/login
-- 2. Email: chamundam289@gmail.com
-- 3. Password: chamunda@321
-- 4. Should successfully login and redirect to admin dashboard

-- TROUBLESHOOTING: If login still doesn't work
-- 1. Check browser console for errors
-- 2. Verify user exists in auth.users table
-- 3. Check if email is confirmed (email_confirmed_at should not be null)
-- 4. Try logging in with Google first, then set password

-- Optional: Create admin roles table entry
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