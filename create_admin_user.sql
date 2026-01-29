-- Create admin user in Supabase Auth
-- This should be run in the Supabase SQL editor or via the Auth dashboard

-- Note: In production, you would create admin users through the Supabase Auth dashboard
-- or use the Supabase Auth API. This is just for reference.

-- The admin check in the AuthContext is currently based on email:
-- user?.email === 'admin@electrostore.com' || user?.email === 'chamundam289@gmail.com'

-- To create an admin user, you can:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" 
-- 3. Enter email: admin@electrostore.com
-- 4. Enter password: admin123
-- 5. Click "Add user"

-- Or use the existing user chamundam289@gmail.com which is already set as admin

-- You can also create a proper admin roles table:
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Insert admin user (replace with actual user ID from auth.users)
-- INSERT INTO public.admin_users (user_id, email, role, permissions) 
-- VALUES ('your-user-id-here', 'admin@electrostore.com', 'super_admin', '{"all"}');

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access for authenticated users" ON public.admin_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow full access for service role" ON public.admin_users FOR ALL TO service_role USING (true);